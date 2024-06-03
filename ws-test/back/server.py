from flask import Flask, request
from flask_cors import CORS
import stomp
import time

from listener import TestListener


app = Flask(__name__)
cors = CORS(app, resources={
  r"/api/*": {"origin": "127.0.0.1"},
})

MQurl = "127.0.0.1"
MQwebport = "15674"
MQport = "61613"
stomp_type = 'topic' # cannot changed

room_list = []


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/api/create_room", methods=['GET'])
def create_room_test():

    # for test, get room_id
    #params = request.get_json()
    # print(f"  - receive: {params}")
    room_id = '12345'
    # room_id have to generate ramdonly


    destination = room_id
    print({"ws_url": f'{MQurl}:{MQwebport}', "ws_destination": destination})
    return {"ws_url": f'{MQurl}:{MQwebport}', "room_code": destination}
    
    

    


@app.route("/api/enter_room/<arg>", methods=['GET'])
def enter_room_test(arg):

    # for test, get room_id
    #params = request.get_json()
    # print(f"  - receive: {params}")
    room_id = arg
    # room_id have to generate ramdonly

    destination = room_id

    return {"ws_url": f'{MQurl}:{MQwebport}', "room_code": destination}



### test send in server?

@app.route("/api/collect_keyword/<arg>", methods=['GET'])
def collect_test(arg):

    return {"Success": f"{arg} received."}



if __name__ == '__main__':  
    app.run('127.0.0.1',port=5000,debug=True)



#https://pypi.org/project/wstompy/