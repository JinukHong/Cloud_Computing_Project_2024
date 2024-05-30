from flask import Flask, request
from flask_cors import CORS
import stomp
import time

from listener import TestListener


app = Flask(__name__)
cors = CORS(app, resources={
  r"/room/*": {"origin": "127.0.0.1"},
})

MQurl = "127.0.0.1"
MQwebport = "15674"
MQport = "61613"
stomp_type = 'topic' # cannot changed

room_list = []


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/room/create", methods=['POST'])
def create_room():

    # for test, get room_id
    params = request.get_json()
    # print(f"  - receive: {params}")
    room_id = params['room_id']
    # room_id have to generate ramdonly


    destination = f'/{stomp_type}/{room_id}'

    if(destination not in room_list):
        # server also need to listen
        conn = stomp.Connection([(MQurl, MQport)])
        conn.set_listener('', TestListener())
        conn.connect()
        id = 1
        conn.subscribe(destination=destination, id=id, ack='auto')

        room_list.append(destination)
    
        #conn.disconnect()
        print({"ws_url": f'{MQurl}:{MQwebport}', "ws_destination": destination})
        return {"ws_url": f'{MQurl}:{MQwebport}', "ws_destination": destination}
    
    print({"Error": "room already exist"})
    return {"Error": "room already exist"}
    

    


@app.route("/room/enter", methods=['POST'])
def enter_room():

    # for test, get room_id
    params = request.get_json()
    # print(f"  - receive: {params}")
    room_id = params['room_id']
    # room_id have to generate ramdonly

    destination = f'/{stomp_type}/{room_id}'

    if(destination in room_list):
        return {"ws_url": f'{MQurl}:{MQwebport}', "ws_destination": destination}
    
    # room not created.
    return {"Error": "Room is not exist."}



### test send in server?

@app.route("/room/send_msg", methods=['GET'])
def send_test():

    destination = f'/topic/12345'

    if(destination in room_list):
        conn = stomp.Connection([(MQurl, MQport)])
        conn.connect()

        for i in range(20):
            conn.send(body=f'server-test-{i}', destination=destination)
            print(f'server-test-{i}',)
            time.sleep(1)
        return {"Success": "send test msg in server"}
    
    # room not created.
    return {"Error": "Room is not exist."}



if __name__ == '__main__':  
    app.run('127.0.0.1',port=5000,debug=True)



#https://pypi.org/project/wstompy/