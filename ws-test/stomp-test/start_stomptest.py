import time
import sys
import json

import stomp

conn = stomp.Connection([('127.0.0.1', 61613)])
conn.connect()
body = {'type':'ready_game'}
conn.send(body=json.dumps(body), destination='/topic/12345')
    