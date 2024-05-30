import './assets/js/stomp.js';

var stomp_client; 
var SUBSCRIPTION;
var DESTINATION;
const server_url = "http://127.0.0.1:5000";


//////////////////////////////////////////// Stomp Listenter Functions //////////////////////////////////////////////

function inputKeyword(){
    // change component to input keyword
}

function startGame(image){
    // show image
    // change component to guess
}

function setOtherPlayerProgress(progresses){
    // show&edit other player's progress
}

function showGameResult(result){
    // show winner
    // (optional) show player's keyword
    // close socket
}

//////////////////////////////////////////// Stomp Connection //////////////////////////////////////////////


function onMessageReceived(payload) {
    console.log('Message Received');
    console.log(payload);
    console.log(payload.body);
    
    // print log for test
    $(".test").append(`<p>${payload}</p>`);

    var body = payload.body;

    switch(body['type']){
        case 'Preparing':
            inputKeyword();
            break
        case 'GameStart':
            startGame(image);
            break
        case 'GameProgress':
            setOtherPlayerProgress(progresses);
            break
        case 'GameEnd':
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
    
    xhr.open("POST", server_url+"/api/create_room", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    const nickname = $(".nickname").value;

    const body = JSON.stringify({
        name: nickname
    });

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            console.log(`url: ${response_text.ws_url}`);
            console.log(`dest: ${response_text.ws_destination}`);
            openSocket(response_text.ws_url, response_text.ws_destination);
            
        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };

    xhr.send(body);
});

// Enter room
$(".enterRoomBtn").on('click', function(){
    const xhr = new XMLHttpRequest();
    xhr.open("POST", server_url+"/api/enter_room/", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    const room_id = $(".room_id").value;
    const nickname = $(".nickname").value;

    const body = JSON.stringify({
        room_id: room_id,
        name: nickname
    });

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            console.log(response_text)
            console.log(`url: ${response_text.ws_url}`);
            console.log(`dest: ${response_text.ws_destination}`);
            openSocket(response_text.ws_url, response_text.ws_destination);
            
        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };

    xhr.send(body);

});

// Start Game
$(".startGameBtn").on('click', function(){
    const xhr = new XMLHttpRequest();
    xhr.open("POST", server_url+"/api/v1/game_start", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    

});

// Send Keyword
$(".submitKeywordBtn").on('click', function(){
    const xhr = new XMLHttpRequest();
    xhr.open("POST", server_url+"/api/collect_keyword/{단어}", true);
    xhr.setRequestHeader("Content-Type", "application/json");

});

// Guess word
$(".guessBtn").on('click', function(){
    const xhr = new XMLHttpRequest();
    xhr.open("POST", server_url+"/api/v1/check_similartiy/{단어}", true);
    xhr.setRequestHeader("Content-Type", "application/json");

});
//















//////////////////////////////////////////// Test functions //////////////////////////////////////////////


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


