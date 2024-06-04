document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startButton');
    const submitGuessButton = document.getElementById('submitGuess');

    const nickname = new URLSearchParams(window.location.search).get('nickname');
    const roomCode = new URLSearchParams(window.location.search).get('roomCode');

    // Display room code if element exists
    const roomCodeElement = document.getElementById('roomCode');
    if (roomCodeElement) {
        roomCodeElement.value = roomCode;
    }

    // Add current user to the participants list if element exists
    const participantsList = document.getElementById('participantsList');
    if (participantsList) {
        const currentUser = document.createElement('li');
        currentUser.textContent = nickname;
        participantsList.appendChild(currentUser);
    }

    const socket = new WebSocket('ws://yourserveraddress/ws'); // Replace with your WebSocket server address

    socket.onopen = function(event) {
        console.log('WebSocket is connected.');
    };

    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message.type === 'imageGeneration') {
            displayGeneratedImage(message.imageUrl);
        } else if (message.type === 'wordSubmission') {
            updateResultsTable(message);
        } else if (message.type === 'participantJoined') {
            addParticipantToList(message.nickname);
        }
    };

    socket.onerror = function(error) {
        console.log('WebSocket Error: ', error);
    };

    socket.onclose = function(event) {
        console.log('WebSocket is closed now.');
    };

    if (startButton) {
        startButton.addEventListener('click', function() {
            document.getElementById('waitingRoom').style.display = 'none';
            document.getElementById('gameRoom').style.display = 'block';
            socket.send(JSON.stringify({ type: 'startGame' }));
        });
    }

    if (submitGuessButton) {
        submitGuessButton.addEventListener('click', function() {
            const guessInput = document.getElementById('guessInput').value;
            const message = {
                type: 'wordSubmission',
                nickname: nickname,
                word: guessInput
            };
            socket.send(JSON.stringify(message));
        });
    }

    function displayGeneratedImage(imageUrl) {
        const imageContainer = document.getElementById('imageContainer');
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
    }

    function updateResultsTable(message) {
        const resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
        const row = resultsTable.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);
        const cell5 = row.insertCell(4);

        const rowNumber = resultsTable.rows.length + 1; // Adjust row number
        cell1.textContent = rowNumber;
        cell2.textContent = message.word;
        cell3.textContent = message.similarity[0] + '%';
        cell4.textContent = message.similarity[1] + '%';
        cell5.textContent = message.similarity[2] + '%';
    }

    function addParticipantToList(nickname) {
        const participant = document.createElement('li');
        participant.textContent = nickname;
        if (participantsList) {
            participantsList.appendChild(participant);
        }
    }
});
