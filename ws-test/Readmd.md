#  Flask Server
- room 관리 및 서버도 room listen
    - listener로 처리?


#  Web Server
- http request to server:  room open / 및 room enter 요청
    - response:  room에 대한 ws 
- 간단한 확인용 테스트
- 크롬탭 여러개로 테스트 동기화 여부 확인가능
    - 크롭탭은 별도 세션 -> 웹소켓 별도로 부여받음




#  RabbitMQ
- Message queue 중계 서버로 게임 내의 세션및 실시간 연결을 관리

- 실행방법

        $ docker build --tag myrabbitmq ./rabbitmq/
        $ docker run -it --rm --name rabbitmq -p 61613:61613 -p 15672:15672 -p 15674:15674 myrabbitmq






## Test

MQ server:

- myrabbitmq: docker

        $ docker run -it --rm --name rabbitmq -p 61613:61613 -p 15672:15672 -p 15674:15674 myrabbitmq

---

Web server:

- index.html: Open Live Server

    create room: room created with code(here 12345)

    enter room: subscribe /topic/12345 (when only room exist in server)

    out room: unsubscribe

    send test: send to /topic/12345 from web client (client also listen self)

    send test in server: send 20 times to /topic/12345 from server node

---

flask server: 
    
    $ python.exe .\server.py