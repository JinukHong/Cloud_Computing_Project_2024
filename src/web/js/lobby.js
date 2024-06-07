import '../assets/js/stomp.js';
import * as Listener from './listener.js'

const urlParams = new URLSearchParams(window.location.search);
const nickname = urlParams.get('nickname');
const roomCode = urlParams.get('roomCode');

const SERVER_URL = "https://cca.pnu.app";
const WS_URL = "ccs.pnu.app"
var stomp_client; 
var SUBSCRIPTION;
var session_interval;


//////////////////////////////////////////// Stomp Connection //////////////////////////////////////////////


function onMessageReceived(payload) {
    var body = JSON.parse(payload.body);
    // console.log('Message Received');
    // console.log(payload);
    // console.log(body);
    // console.log(body.type)

    switch(body['type']){
        case 'member_list':
            var members = body['members'];
            Listener.refreshMembers(members);
            break
        case 'ready_game':
            Listener.inputKeyword();
            break
        case 'start_game':
            var imageUrl = body['image_url'];
            var players = body['members'];
            Listener.startGame(imageUrl, players);
            break
        case 'result_similarity':
            var result = body['result'];
            Listener.setPlayerProgress(result);
            break
        case 'end_game':
            var result = body['result'];
            Listener.showGameResult(result, stomp_client);
            break
        default:
            // error handling
    }

};


function openSocket(destination) {
    stomp_client = Stomp.client(`wss://${WS_URL}/ws`);

    var connect_callback = function() {
        console.log('STOMP Socket connected');
        destination = "/topic/" + destination;
        SUBSCRIPTION = stomp_client.subscribe(destination, response => onMessageReceived(response));
    };

    var error_callback = function(error) {
        console.log('STOMP Socket cannot connected');
        console.log(error.headers?.message);
    };

    let connectHeader = {};
    stomp_client.connect(connectHeader, connect_callback, error_callback);
};

export function closeSocket() {
    stomp_client.unsubscribe(SUBSCRIPTION);

    var disconnect_callback = function() {
        console.log("STOMP Socket disconnected");
    }

    stomp_client.disconnect(disconnect_callback);
}


$(document).ready(function () {
    document.getElementById('roomCode').value = roomCode;
    openSocket(roomCode);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", SERVER_URL+"/api/info", true);
    xhr.withCredentials = true;
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            const participants = response_text.room_users;;
            Listener.refreshMembers(participants);
            console.log(`Game started.`);

        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };
    xhr.send();


    session_interval = setInterval(() => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", SERVER_URL+"/api/session", true);
        xhr.withCredentials = true;
        xhr.onload = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                const restxt = JSON.parse(xhr.responseText);
                if (roomCode != restxt.room_id || nickname != restxt.nickname) {
                    clearInterval(session_interval);
                    alert("세션이 만료되었습니다.\n\n동일 브라우저로 여러개의 탭을 사용하여 동시에 플레이 하면 기존 세션이 만료될 수 있습니다");
                    setTimeout(() => {
                        window.location.href = `create_room.html?nickname=${encodeURIComponent(nickname)}`;
                    }, 500);
                }
    
            } else if (xhr.status == 403){
                clearInterval(session_interval);
                alert("세션이 만료되었습니다.\n\n동일 브라우저로 여러개의 탭을 사용하여 동시에 플레이 하면 기존 세션이 만료될 수 있습니다");
                setTimeout(() => {
                    window.location.href = `create_room.html?nickname=${encodeURIComponent(nickname)}`;
                }, 500);
            } else {
            }
        };
        xhr.send();
    }, 1000);
    

    // http request get participants once. or periodically send participants list MQ before start.
    

    // if host -> show game start button
    if(urlParams.get('host') == nickname){
        document.getElementById('startGameBtn').style.display = 'block';
    }

    // enable start game btn
    $("#startGameBtn").on('click', function(){
        // $.ajax({
        //     type: "GET",
        //     url: SERVER_URL+"/api/game_start",
        //     withCredentials: true,
        //     success: function (response) {
        //         console.log(`Game started.`);
        //     },
        // });

        // fetch(SERVER_URL+"/api/game_start", {method: 'get', credentials: 'include'})
        // .then((response) => response.json())
        // .then((data) => console.log(data))

        if (Listener.getParticipantsCount() == 1) {
            alert("본 게임의 참가자는 최소 2명에서 최대 4명입니다.\n\n \
현재 기능 시현을 위해 1인 시작도 가능하나\n \
맞춰야할 키워드가 없기에 아무 단어나 입력해도\n \
즉시 승리처리되고 게임이 종료됩니다.");
        }

        const xhr = new XMLHttpRequest();
        xhr.open("GET", SERVER_URL+"/api/game_start", true);
        xhr.withCredentials = true;
        xhr.onload = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                //const response_text = JSON.parse(xhr.responseText);
                console.log(`Game started.`);

            } else {
                console.log(`Error: ${xhr.responseText}`);
                
                var restxt = JSON.parse(xhr.responseText);
                alert(`${restxt.message}`);
            }
        };
        xhr.send();

    });
});


