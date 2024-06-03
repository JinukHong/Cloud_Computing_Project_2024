import './assets/js/stomp.js';

var stomp_client; 
var SUBSCRIPTION;
var DESTINATION;
var ROOM_CODE;
const SERVER_URL = "http://127.0.0.1:5000";
const WS_URL = "127.0.0.1:15674"



//////////////////////////////////////////// Stomp Connection //////////////////////////////////////////////


function onMessageReceived(payload) {
    console.log('Message Received');
    console.log(payload);
    console.log(payload.body);
    
    // print log for test
    $(".test").append(`<p>${payload}</p>`);

    var body = payload.body;

    switch(body['type']){
        case 'refresh_member':
            refreshMembers(members);
            break
        case 'ready_game':
            inputKeyword();
            break
        case 'start_game':
            startGame(image);
            break
        case 'result_similarity':
            setOtherPlayerProgress(progresses);
            break
        case 'end_game':
            showGameResult(result);
            break
        default:
            // error handling
    }

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

// const sendSocket = (msg) => {
//     var headers = {};
//     var body = msg;
//     stomp_client.send(DESTINATION, headers, body);
// }

const closeSocket = () => {
    stomp_client.unsubscribe(SUBSCRIPTION);

    var disconnect_callback = function() {
        console.log("STOMP Socket disconnected");
        $(".conn").text(`nothing connected.`)
    }

    stomp_client.disconnect(disconnect_callback);
}


//////////////////////////////////////////// Interaction //////////////////////////////////////////////


// Create Room
$(".createRoomBtn").on('click', function(){
    const xhr = new XMLHttpRequest();
    
    xhr.open("GET", SERVER_URL+"/api/create_room", true);
    // xhr.open("POST", SERVER_URL+"/api/create_room", true);
    // xhr.setRequestHeader("Content-Type", "application/json");
    // const body = JSON.stringify({name: nickname});

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            var dest = "/topic/" + response_text.room_code;
            openSocket(WS_URL, dest);
            // openSocket(response_text.ws_url, response_text.ws_destination);
        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };
    xhr.send();
});


// Enter room
$(".enterRoomBtn").on('click', function(){
    var room_code = $(".room_code").text;

    const xhr = new XMLHttpRequest();

    xhr.open("GET", SERVER_URL+"/api/enter_room/"+room_code, true);
    // xhr.open("POST", SERVER_URL+"/api/enter_room/", true);
    // xhr.setRequestHeader("Content-Type", "application/json");
    // const body = JSON.stringify({room_id: room_id, name: nickname});

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            var dest = "/topic/" + response_text.room_code;
            openSocket(WS_URL, dest);
            // openSocket(response_text.ws_url, response_text.ws_destination);
            
        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };

    xhr.send();

});














//////////////////////////////////////////// Test functions //////////////////////////////////////////////


$(".out").on('click', function(){
    closeSocket();
});

$(".send").on('click', function(){
    var msg = $('.msg').val();
    sendSocket(msg);
});

$(".send_s").on('click', function(){
});


