import {closeSocket} from './lobby.js'

const urlParams = new URLSearchParams(window.location.search);
const nickname = urlParams.get('nickname');

const SERVER_URL = "http://127.0.0.1:5000";

const roomParticipants = [];

var myGuess;

//////////////////////////////////////////// Stomp Listenter Functions //////////////////////////////////////////////


export function refreshMembers(participants){
    // refresh participant list
    console.log('refreshMembers');

    const participantsList = document.getElementById('participantsList');
    participants.forEach(participant => {
        // need to add: if member out of game
        if (!(roomParticipants.includes(participant))){
            roomParticipants.push(participant);
            const li = document.createElement('li');
            li.textContent = participant;
            participantsList.appendChild(li);
        }
        
    });
}

export function inputKeyword(){
    console.log('inputKeyword');
    // show input keyword element
    // show submit btn

    // enable send Keyword btn 
    $("#submitKeywordBtn").on('click', function(){
        console.log('submit');
        var myKeyword = $("#keywordInput").val();
        console.log(myKeyword);
        if(myKeyword){
            const xhr = new XMLHttpRequest();
            xhr.open("GET", SERVER_URL+`/api/collect_keyword/${myKeyword}`, true);
            xhr.onload = () => {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    const response_text = JSON.parse(xhr.responseText);
                    console.log(response_text);
                } else {
                    console.log(`Error: ${xhr.responseText}`);
                }
            };
            xhr.send();
        }
        
    });
    
}



export function startGame(image){
    console.log('startGame');
    // show image
    //$("#image").
    // show guess input/btn
    // show guess table
    // show other player's progress


    // change component to guess
    console.log('startGame');

    // enable guess word btn
    $("#guessBtn").on('click', function(){
        myGuess = $("#guessInput").val();

        const xhr = new XMLHttpRequest();
        xhr.open("GET", SERVER_URL+`/api/check_similartiy/${myGuess}`, true);
        xhr.onload = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                const response_text = JSON.parse(xhr.responseText);
                console.log(response_text);
                // response_test is array that contains (4) similarity percentage.
                
                // const similarities = ;

                const similaritiesList = $('#similaritiesList');
                var tr = document.createElement('tr');
                similarities.forEach((similarity, index) => {
                    if(similarity == 100){
                        // show what keyword is.
                        $('#keywordList').children[index].text = myGuess;
                    }
                    // make new row
                    const td = document.createElement('td');
                    td.textContent = similarity;
                    tr.appendChild(td);

                });
                // add row
                similaritiesList.appendChild(tr);
            } else {
                console.log(`Error: ${xhr.responseText}`);
            }
        };
        xhr.send();
    });
}

export function setOtherPlayerProgress(result){
    // show&edit other player's progress
    console.log('setOtherPlayerProgress');

    var player = progresses['name'];
    if(player!=nickname){
        progresses = progresses['progresses'];

        const playersList = $('#player');
        progresses.forEach((progress, index) => {
            if (playersList.children[index].val() < progress){
                playersList.children[index].textContent = progress;
            }   
        });
    }
}


export function showGameResult(result){
    console.log('showGameResult');
    // find/set winner element
    $("#winner").textContent = result.winner;

    // (optional) show player's keyword
    const keywordFromWho = $('#keywordFromWho');
    var tr = document.createElement('tr');
    result.keywordfrom.names.forEach(name => {
        // make new row
        const td = document.createElement('th');
        td.textContent = name;
        tr.appendChild(td);
    });
    // add row
    keywordFromWho.appendChild(tr);
    var tr = document.createElement('tr');
    result.keywordfrom.keywords.forEach(keyword => {
        // make new row
        const td = document.createElement('td');
        td.textContent = keyword;
        tr.appendChild(td);
    });
    keywordFromWho.appendChild(tr);

    // close socket
    closeSocket();
    
}