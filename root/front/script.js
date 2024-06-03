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
                const roomCode = generateRoomCode(nickname);
                redirectToLobbyPage(nickname, roomCode);
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
