import {closeSocket} from './lobby.js'

const urlParams = new URLSearchParams(window.location.search);
const nickname = urlParams.get('nickname');

const SERVER_URL = "https://cc.pnu.app";

const roomParticipants = [];

var myKeyword;
var myGuess;
var myGuessCnt;

//////////////////////////////////////////// Stomp Listenter Functions //////////////////////////////////////////////


export function refreshMembers(participants){
    //[{"user_id": 134, "name": "kang"}, {"user_id": 135, "name": "b"}]
    // refresh participant list
    console.log('refreshMembers');

    const participantsList = document.getElementById('participantsList');
    participants.forEach(participant => {
        // need to add: if member out of game
        if (!(roomParticipants.includes(participant.name))){
            roomParticipants.push(participant.name);
            const li = document.createElement('li');
            li.textContent = participant.name;
            participantsList.appendChild(li);
        }
        
    });
}

export function inputKeyword(){ // finish
    console.log('inputKeyword');
    
    document.getElementById('startGameBtn').style.display = 'none';
    document.getElementById('wordtoImage').style.display = 'block';

    // enable send Keyword btn 
    $("#submitKeywordBtn").on('click', function(){
        console.log('submit');
        myKeyword = $("#keywordInput").val();
        console.log(myKeyword);
        if(myKeyword){
            const xhr = new XMLHttpRequest();
            xhr.open("GET", SERVER_URL+`/api/collect_keyword/${myKeyword}`, true);
            xhr.withCredentials = true;
            xhr.onload = () => {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    // const response_text = JSON.parse(xhr.responseText);
                    // console.log(response_text);
                    console.log(`Success: ${xhr.responseText}`);
                                    
                    document.getElementById('wordtoImage').style.display = 'none';
                    document.getElementById('loading-phase').style.display = 'block';
                } else {
                    console.log(`Error: ${xhr.responseText}`);
                }
            };
            xhr.send();
        }
        
    });
    
}



export function startGame(imageUrl, players){ // finish
    console.log('startGame');
    
    document.getElementById('waitingRoom').style.display = 'none';
    document.getElementById('loading-phase').style.display = 'none';
    document.getElementById('gameRoom').style.display = 'block';

    // show image
    const imageContainer = document.getElementById('imageContainer');
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    imageContainer.innerHTML = '';
    imageContainer.appendChild(img);

    // show other player's progress
    const progress_status = document.getElementById('progress-status');
    // <div>username3 : <span></span>/4</div>
    
    roomParticipants.forEach((participant) => {
        if(participant != nickname){
            const div = document.createElement('div');
            div.textContent = `${participant} : `;
            const span = document.createElement('span');
            span.textContent = 0;
            div.className = 'player_progress';
            div.appendChild(span);
            progress_status.appendChild(div);
        }
    })

    
    // set guessTable along to players.
    const guessTable = document.getElementById('result-head');
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = '#';
    tr.appendChild(th);

    roomParticipants.forEach((participant) => {
        
        const th = document.createElement('th');
        if(participant != nickname){
            th.textContent = '??';
        }
        else{
            th.textContent = `${myKeyword}`;
        }
        tr.appendChild(th);
    });
    guessTable.appendChild(tr);


    console.log('startGame');

    // enable guess word btn
    $("#guessBtn").on('click', function(){
        myGuess = $("#guessInput").val();

        const xhr = new XMLHttpRequest();
        xhr.open("GET", SERVER_URL+`/api/check_similarity/${myGuess}`, true);
        xhr.withCredentials = true;
        xhr.onload = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // const response_text = JSON.parse(xhr.responseText);
                console.log(`Success: ${xhr.responseText}`);
                
            } else {
                console.log(`Error: ${xhr.responseText}`);
            }
        };
        xhr.send();
    });
}

export function setPlayerProgress(result){ // show other player's progress
    // show&edit other player's progress
    // "result": {"askedBy": {"user_id": 234, "nickname": "kang"}, "similarities": {"kang": 25.72900950908661, "a": 41.03550314903259}}}
    console.log('setOtherPlayerProgress');
    if(result.askedBy.nickname == nickname){
        
        const myGuessList = document.getElementById('result-body');
        var tr = document.createElement('tr');
        const td = document.createElement('td');
        myGuessCnt+=1;
        td.textContent = myGuessCnt;

        result.similarities.forEach((similarity_info) => {
            //var player = similarity_info[0];
            var similarity = similarity_info[1];
            if(similarity == 100){
                // show what keyword is.
                roomParticipants.forEach((participant, index) => {
                    if(participant == nickname){
                        // need to modify 
                        $('#resultTable > thead > tr > th').children[index+1].text = myGuess;
                    }
                });
                
            }
            // make new row
            const td = document.createElement('td');
            td.textContent = similarity;
            tr.appendChild(td);

        });
        // add row
        myGuessList.appendChild(tr);
    }
    else{
        // show other player's progress

        // var askedPlayer = result.askedBy;
        // progress_statusdocument.getElementById('progress-status');
    }
}


export function showGameResult(result){ // finish
    console.log('showGameResult');
    // find/set winner element
    $("#gameFinish > h1 > span").text(`${result.winner}`);;

    // (optional) show player's keyword
    const keywordsList = result.keywords;

    const keywordsTable = document.getElementById('keywordsTable-body');

    keywordsList.forEach((keyword_info) => {
        const tr_head = document.createElement('tr');
        const tr_body = document.createElement('tr');

        const th = document.createElement('th');
        const tr = document.createElement('tr');
        th.textContent = keyword_info[0];
        tr.textContent = keyword_info[1];

        tr_head.appendChild(th);
        tr_body.appendChild(tr);
    });
    keywordsTable.appendChild(tr_head);
    keywordsTable.appendChild(tr_body);

    // close socket
    closeSocket();
    
}