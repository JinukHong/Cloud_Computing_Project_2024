import '../assets/js/stomp.js';
import * as Listener from './listener.js'

const urlParams = new URLSearchParams(window.location.search);
const nickname = urlParams.get('nickname');
const roomCode = urlParams.get('roomCode');

const SERVER_URL = "http://127.0.0.1:5000";
const WS_URL = "127.0.0.1:15674"
var stomp_client; 
var SUBSCRIPTION;


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
            var players = body['players'];
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
    stomp_client = Stomp.client(`ws://${WS_URL}/ws`);

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

    // http request get participants once. or periodically send participants list MQ before start.
    const participants = [nickname];
    Listener.refreshMembers(participants);

    // if host -> show game start button

    // enable start game btn
    $("#startGameBtn").on('click', function(){
        const xhr = new XMLHttpRequest();
        xhr.open("GET", SERVER_URL+"/api/v1/game_start", true);
        xhr.onload = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                //const response_text = JSON.parse(xhr.responseText);
                console.log(`Game started.`);

            } else {
                console.log(`Error: ${xhr.responseText}`);
            }
        };
        xhr.send();

    });
});


