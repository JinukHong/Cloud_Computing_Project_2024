const SERVER_URL = "http://127.0.0.1:5000";

// Input nickname
$("#submitButton").on('click', function(){
    const nickname = document.getElementById('nicknameInput').value;
    if (nickname) {
        window.location.href = `create_room.html?nickname=${encodeURIComponent(nickname)}`;
    }
});

// Create Room
$("#createRoomButton").on('click', function(){
    const nickname = new URLSearchParams(window.location.search).get('nickname');

    const xhr = new XMLHttpRequest();    
    xhr.open("GET", SERVER_URL+`/api/create_room?nickname=${nickname}`, true);
    // xhr.open("POST", SERVER_URL+"/api/create_room", true);
    // xhr.setRequestHeader("Content-Type", "application/json");
    // const body = JSON.stringify({name: nickname});

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            const roomCode = response_text.room_code;
            if (nickname) {
                window.location.href = `lobby.html?nickname=${encodeURIComponent(nickname)}&roomCode=${encodeURIComponent(roomCode)}`;
            }
        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };
    xhr.send();
});


// Enter room
$("#joinRoomButton").on('click', function(){
    const roomCode = prompt("참여할 방 코드를 입력하세요:");
    const nickname = new URLSearchParams(window.location.search).get('nickname');

    const xhr = new XMLHttpRequest();

    xhr.open("GET", SERVER_URL+`/api/enter_room/${roomCode}?nickname=${nickname}`, true);
    // xhr.open("POST", SERVER_URL+"/api/enter_room/", true);
    // xhr.setRequestHeader("Content-Type", "application/json");
    // const body = JSON.stringify({room_id: room_id, name: nickname});

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response_text = JSON.parse(xhr.responseText);
            
            const roomCode = response_text.room_code;
            if (nickname) {
                window.location.href = `lobby.html?nickname=${encodeURIComponent(nickname)}&roomCode=${encodeURIComponent(roomCode)}`;
            }
        } else {
            console.log(`Error: ${xhr.responseText}`);
        }
    };

    xhr.send();

});


// Start game
$(document).ready(function() {
    $('#startButton').click(function() {
        $('#first-phase').css('display', 'block');
        $('#waitingRoom').css('display', 'none');
    });

    $('#submitKeywordBtn').click(function() {
        $('#first-phase').css('display', 'none');
        $('#waitingRoom').css('display', 'block');
    });
});