import './assets/js/stomp.js';

var stomp_client; 
var SUBSCRIPTION;
var DESTINATION;

function onMessageReceived(payload) {
    console.log('Message Received');
    console.log(payload.body);

    $(".test").append(`<p>${payload.body}</p>`);
};

const openSocket = (ws_url, destination) => {
    stomp_client = Stomp.client(`ws://${ws_url}/ws`);

    var connect_callback = function() {
        console.log('STOMP Socket connected');
        SUBSCRIPTION = stomp_client.subscribe(destination, response => onMessageReceived(response));
        
        $(".conn").text(`${destination} connected.`)

        DESTINATION = destination;
    };

    var error_callback = function(error) {
        console.log('STOMP Socket cannot connected');
        console.log(error.headers?.message);
    };

    let connectHeader = {};
    stomp_client.connect(connectHeader, connect_callback, error_callback);
};

const sendSocket = (msg) => {
    var headers = {};
    var body = msg;
    stomp_client.send(DESTINATION, headers, body);
}

const closeSocket = () => {
    stomp_client.unsubscribe(SUBSCRIPTION);

    var disconnect_callback = function() {
        console.log("STOMP Socket disconnected");
        $(".conn").text(`nothing connected.`)
    }

    stomp_client.disconnect(disconnect_callback);
}

document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submitButton');
    const createRoomButton = document.getElementById('createRoomButton');
    const joinRoomButton = document.getElementById('joinRoomButton');

    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const nickname = document.getElementById('nicknameInput').value;
            if (nickname) {
                redirectToCreateRoomPage(nickname);
            }
        });
    }

    if (createRoomButton) {
        createRoomButton.addEventListener('click', function() {
            const nickname = new URLSearchParams(window.location.search).get('nickname');
            if (nickname) {
                createRoom(nickname);
            }
        });
    }

    if (joinRoomButton) {
        joinRoomButton.addEventListener('click', function() {
            const nickname = new URLSearchParams(window.location.search).get('nickname');
            if (nickname) {
                showRoomCodePrompt(nickname);
            }
        });
    }

    $(".out").on('click', function(){
        closeSocket();
    });

    $(".send").on('click', function(){
        var msg = $('.msg').val();
        sendSocket(msg);
    });

    $(".send_s").on('click', function(){
        const xhr = new XMLHttpRequest();
        const server_url = "http://127.0.0.1:5000";
        xhr.open("GET", server_url+"/room/send_msg", true);

        xhr.onload = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                const response_text = JSON.parse(xhr.responseText);
                
            } else {
                console.log(`Error: ${xhr.responseText}`);
            }
        };

        xhr.send();
    });
});

function generateRoomCode(nickname) {
    // 간단한 해시 함수로 닉네임을 이용한 방 코드 생성 (예시)
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) {
        const char = nickname.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return 'ROOM' + Math.abs(hash);
}

function redirectToCreateRoomPage(nickname) {
    window.location.href = `create_room.html?nickname=${encodeURIComponent(nickname)}`;
}

function redirectToLobbyPage(nickname, roomCode) {
    window.location.href = `lobby.html?nickname=${encodeURIComponent(nickname)}&roomCode=${encodeURIComponent(roomCode)}`;
}

function showRoomCodePrompt(nickname) {
    const roomCode = prompt("참여할 방 코드를 입력하세요:");
    if (roomCode) {
        redirectToLobbyPage(nickname, roomCode);
    }
}

function createRoom(nickname) {
    const xhr = new XMLHttpRequest();
    const server_url = "http://127.0.0.1:5000";
    xhr.open("POST", server_url + "/room/create", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    const room_id = generateRoomCode(nickname);

    const body = JSON.stringify({
        room_id: room_id,
        name: nickname
    });

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            console.log(`url: ${response_text.ws_url}`);
            console.log(`dest: ${response_text.ws_destination}`);
            redirectToLobbyPage(nickname, room_id);
        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };

    xhr.send(body);
}
