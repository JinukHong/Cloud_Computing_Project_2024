from flask import Flask, session, request, jsonify, send_file
from flask_session import Session
import psycopg2
import os
import requests
from PIL import Image
import io
from googletrans import Translator
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import stomp
from flask_cors import CORS
import json
import threading

app = Flask(__name__)
translator = Translator()
model = SentenceTransformer('jhgan/ko-sroberta-multitask')

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config['SESSION_COOKIE_SAMESITE'] = "None"
app.config['SESSION_COOKIE_SECURE'] = True

Session(app)

cors = CORS(app, resources={
  r"/api/*": {
        "origin": "127.0.0.1:5500", 
        "allow_headers": ["Content-Type", "Authorization"]
    },
}, supports_credentials=True)

API_KEY = os.getenv('OPENAI_API_KEY')
if not API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set.")

conn = stomp.Connection([('mq', 61613)])
conn.connect()


def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def execute_query(query, args=(), fetchone=False, fetchall=False, commit=False):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, args)
    result = None
    if fetchone:
        result = cur.fetchone()
    elif fetchall:
        result = cur.fetchall()
    if commit:
        conn.commit()
    cur.close()
    conn.close()
    return result


@app.route('/api/info', methods=['GET'])
def my_info():
    if 'user_id' in session:
        user_id = session['user_id']
        user_info = execute_query('SELECT id, name, room FROM "user" WHERE id = %s', (user_id,), fetchone=True)
        if user_info:
            room_id = user_info[2]
            room_users = execute_query('SELECT id, name FROM "user" WHERE room = %s', (room_id,), fetchall=True)
            
            room_users_info = [{
                "user_id": user[0],
                "name": user[1]
            } for user in room_users]

            conn.send(body=json.dumps({'type': 'member_list', 'members': room_users_info}), destination='/topic/'+str(room_id))
            return jsonify({
                "message": "User information retrieved successfully",
                "user_id": user_info[0],
                "name": user_info[1],
                "room": user_info[2],
                "room_users": room_users_info
            }), 200
        else:
            return jsonify({"message": "User not found"}), 404
    else:
        return jsonify({"message": "User not logged in"}), 403


@app.route('/api/create_room', methods=['GET'])
def create_room():
    nickname = request.args.get('name', default='Guest')

    user_id = execute_query('INSERT INTO "user" (name) VALUES (%s) RETURNING id', (nickname,), fetchone=True, commit=True)[0]
    room_id = execute_query('INSERT INTO room (status, creator_id) VALUES (%s, %s) RETURNING id', ('준비', user_id), fetchone=True, commit=True)[0]
    execute_query('UPDATE "user" SET room = %s WHERE id = %s', (room_id, user_id), commit=True)

    session['user_id'] = user_id
    session['room_id'] = room_id
    session['nickname'] = nickname
    session['correct_answers'] = set()
    session.get('correct_answers').add(nickname)

    return jsonify({"room_id": room_id, "user_id": user_id, "nickname": nickname}), 200


@app.route('/api/enter_room/<room_code>', methods=['GET'])
def enter_room(room_code):
    nickname = request.args.get('name', default='Guest')

    room_info = execute_query('SELECT id, status, (SELECT COUNT(*) FROM "user" WHERE room = %s) as current_users FROM room WHERE id = %s', (room_code, room_code), fetchone=True)
    if room_info and room_info[1] == '준비' and room_info[2] < 4:
        user_id = execute_query('INSERT INTO "user" (name, room) VALUES (%s, %s) RETURNING id', (nickname, room_code), fetchone=True, commit=True)[0]
        session['user_id'] = user_id
        session['room_id'] = room_code
        session['nickname'] = nickname
        session['correct_answers'] = set()
        session.get('correct_answers').add(nickname)

        room_users = execute_query('SELECT id, name FROM "user" WHERE room = %s', (room_code,), fetchall=True)
        
        room_users_info = [{
            "user_id": user[0],
            "name": user[1]
        } for user in room_users]

        conn.send(body=json.dumps({'type': 'member_list', 'members': room_users_info}), destination='/topic/'+str(room_code))

        return jsonify({"room_id": room_code, "user_id": user_id, "nickname": nickname}), 200
    elif room_info and room_info[2] >= 4:
        return jsonify({"message": "Room is full"}), 403
    elif room_info and room_info[1] != '준비':
        return jsonify({"message": "Room is not ready"}), 403
    else:
        return jsonify({"message": "Room not found"}), 404
    

@app.route('/api/game_start', methods=['GET'])
def game_start():
    room_id = session.get('room_id')
    user_id = session.get('user_id')
    nickname = session.get('nickname')

    if room_id is None or user_id is None:
        return jsonify({"message": "Invalid session or not logged in"}), 403

    room_info = execute_query('SELECT creator_id, status FROM room WHERE id = %s', (room_id,), fetchone=True)
    if room_info is None:
        return jsonify({"message": "Room not found"}), 404

    creator_id, current_status = room_info

    if current_status != '준비':
        return jsonify({"message": "Game cannot start unless the room is in '준비' status"}), 403

    if creator_id != user_id:
        return jsonify({"message": "Only the room creator can start the game"}), 403

    execute_query('UPDATE room SET status = %s WHERE id = %s', ('진행', room_id), commit=True)

    conn.send(body=json.dumps({'type': 'ready_game'}), destination='/topic/'+str(room_id))

    return jsonify({"message": "Game started"}), 200


def send_game_start(room_id, room_users_info):
    keywords = execute_query('SELECT keyword FROM game WHERE room_id = %s', (room_id,), fetchall=True)

    keyword_list = [keyword[0] for keyword in keywords]
    
    image_url = generate_and_show_image(keyword_list)
    message = {
        'type': 'start_game',
        'image_url': image_url,
        'members': room_users_info
    }
    conn.send(body=json.dumps(message), destination='/topic/' + str(room_id))


@app.route('/api/collect_keyword/<word>', methods=['GET'])
def collect_keyword(word):
    room_id = session.get('room_id')
    user_id = session.get('user_id')
    nickname = session.get('nickname')

    if room_id is None or user_id is None:
        return jsonify({"message": "Invalid session or not logged in"}), 403
    
    try:
        execute_query('INSERT INTO game (room_id, user_id, keyword) VALUES (%s, %s, %s)',
                      (room_id, user_id, word), commit=True)
        
        total_users = execute_query('SELECT COUNT(*) FROM "user" WHERE room = %s',
                                    (room_id,), fetchone=True)[0]

        keywords_collected = execute_query('SELECT COUNT(DISTINCT user_id) FROM game WHERE room_id = %s',
                                            (room_id,), fetchone=True)[0]
        
        room_users = execute_query('SELECT id, name FROM "user" WHERE room = %s', (room_id,), fetchall=True)

        room_users_info = [{
            "user_id": user[0],
            "name": user[1]
        } for user in room_users]


        if total_users == keywords_collected:
            threading.Thread(target=send_game_start, args=(room_id, room_users_info)).start()
            return jsonify({"message": f"Keyword '{word}' collected", "status": "All users have submitted keywords"}), 200
        else:
            conn.send(body=json.dumps({"status": f"{keywords_collected}/{total_users} users have submitted keywords", 'members': room_users_info}), destination='/topic/'+str(room_id))
            return jsonify({"message": f"Keyword '{word}' collected", "status": f"{keywords_collected}/{total_users} users have submitted keywords"}), 200

    except psycopg2.IntegrityError:
        return jsonify({"message": "Keyword for this room and user has already been collected"}), 409
    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route('/api/check_similarity/<word>', methods=['GET'])
def check_similarity(word):
    room_id = session.get('room_id')
    user_id = session.get('user_id')
    nickname = session.get('nickname')

    answer_texts = []
    user_name = []
    
    if room_id is None or user_id is None:
        return jsonify({"message": "Invalid session or not logged in"}), 403
    
    keywords = execute_query('SELECT g.user_id, u.name, g.keyword FROM game g JOIN "user" u ON g.user_id = u.id WHERE g.room_id = %s', (room_id,), fetchall=True)

    if not keywords:
        return jsonify({"message": "No keywords found for this room"}), 404
    results = []
    for answers in keywords:
        answer_texts.append(answers[2])
        user_name.append(answers[1])

    similarities = []
    for answer_text in answer_texts:
        score = calculate_text_similarity(answer_text, word)
        similarities.append(float(score))

    pass_info = {}
    for similaritieses in similarities:
        for i in range(len(similarities)):
            pass_info[f'{user_name[i]}'] = similarities[i] * 100

    for name, similarity in pass_info.items():
        if similarity >= 99.99:
            session['correct_answers'].add(name)
    
    score = len(session.get('correct_answers'))
    print(score)
    print(len(keywords))
    print(session.get('correct_answers'))

    if score >= len(keywords):
        kw = {}
        for keyword in keywords:
            kw[keyword[1]] = keyword[2]

        conn.send(body=json.dumps(
            {
                'type': 'end_game',
                'result': {
                    'winner': {
                        'user_id': user_id,
                        'nickname': nickname,
                    },
                    'keywords': kw,
                }
            }
        ), destination='/topic/'+str(room_id))
        execute_query('UPDATE room SET status = %s WHERE id = %s', ('종료', room_id), commit=True)
    
    conn.send(body=json.dumps(
        {'type': 'result_similarity',
         'result': {
             'askedBy': {
                 'user_id': user_id,
                 'nickname': nickname
             },
             'similarities': pass_info,
             'score': score
        }}), destination='/topic/'+str(room_id))
    return jsonify(pass_info)


def create_image_from_text(prompt):
  headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
  }
  data = {
    "prompt": prompt,
    "n": 1,
    "size": "512x512"
  }
  response = requests.post('https://api.openai.com/v1/images/generations', headers=headers, json=data)
  if response.status_code == 200:
    image_data = response.json()
    return image_data['data'][0]['url']
  return None


def generate_and_show_image(words):
  if not all(words):
    return jsonify({'error': 'Empty words are not allowed'}), 400

  words = [word.strip() for word in words]
  translated_words = [translator.translate(word, dest='en').text for word in words]
  prompt = "Create an image that clearly shows all of these elements. Do not write any letter on the image, and make sure that all the elements are shown clearly. Draw in cute style.: " + ", ".join(translated_words)
  print("Translated prompt: ", prompt)

  image_url = create_image_from_text(prompt)
  if not image_url:
    return jsonify({'error': 'Failed to generate image'}), 500

  return image_url



def calculate_text_similarity(text1, text2):
    embeddings = model.encode([text1, text2])
    cos_sim = cosine_similarity([embeddings[0]], [embeddings[1]])
    return cos_sim[0][0]



if __name__ == '__main__':
    app.run(debug=True)