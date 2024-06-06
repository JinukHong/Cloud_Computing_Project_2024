import {closeSocket} from './lobby.js'

const urlParams = new URLSearchParams(window.location.search);
const nickname = urlParams.get('nickname');

const SERVER_URL = "https://cca.pnu.app";

const roomParticipants = [];
var participantsScore = [];

var myKeyword;
var myGuess;
var myGuessCnt = 0;

//////////////////////////////////////////// Stomp Listenter Functions //////////////////////////////////////////////


export function refreshMembers(participants){ // finish
    //[{"user_id": 134, "name": "kang"}, {"user_id": 135, "name": "b"}]
    // refresh participant list
    console.log('refreshMembers');

    const participantsList = document.getElementById('participantsList');
    participants.forEach(participant => {
        // need to add: if member out of game
        if (!(roomParticipants.includes(participant.name))){
            const li = document.createElement('li');
            li.textContent = participant.name;
            participantsList.appendChild(li);

            roomParticipants.push(participant.name);
            participantsScore.push(0);
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
                    $("#myKeyword").val(myKeyword);
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

    const imageContainer2 = document.getElementById('imageContainerWinner');
    const img2 = document.createElement('img');
    img2.src = imageUrl;
    img2.style.width = '100%';
    img2.style.height = '100%';
    imageContainer2.innerHTML = '';
    imageContainer2.appendChild(img2);

    // show other player's progress
    const progress_status = document.getElementById('progress-status');
    // <div>username3 : <span></span>/4</div>
    
    roomParticipants.forEach((participant) => {
        if(participant != nickname){
            const div = document.createElement('div');
            div.textContent = `${participant} : `;
            const span = document.createElement('span');
            span.textContent = 0;
            div.className = 'player-progress';
            div.id = `${participant}-progress`;
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

export function setPlayerProgress(result){ // finish
    // show&edit other player's progress
    // "result": {"askedBy": {"user_id": 425, "nickname": "kkang"}, "similarities": {"kkang": 38.48070502281189, "fong": 24.111109972000122}}}
    console.log('setOtherPlayerProgress');
    if(result.askedBy.nickname == nickname){
        
        const myGuessList = document.getElementById('result-body');
        var tr = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = myGuess;
        tr.appendChild(td);

        roomParticipants.forEach((participant, index) => {
            const similarity = result.similarities[participant];
            console.log(similarity)
            if(Math.abs(similarity - 100) < 0.001){
                $(`#result-head > tr > th:eq(${index + 1})`).text(myGuess);
            }
                
            const td = document.createElement('td');
            td.textContent = Math.round(similarity*100)/100;
            tr.appendChild(td);
            
        });
            
        // add row
        myGuessList.appendChild(tr);
    }
    else{
        // show other player's progress

        const askedPlayer = result.askedBy.nickname;
        const idx = roomParticipants.indexOf(askedPlayer);

        roomParticipants.forEach((participant) => {
            const similarity = result.similarities[participant];
            console.log(similarity);
            if(Math.abs(similarity - 100) < 0.001){
                participantsScore[idx]+=1;
                console.log(`other player score up: ${askedPlayer} ${participantsScore[idx]}`);
                $(`#${askedPlayer}-progress > span`).text(participantsScore[idx]);
            }
        });

    }
}


export function showGameResult(result){ 
    console.log('showGameResult');
    
    document.getElementById('gameRoom').style.display = 'none';
    document.getElementById('gameFinish').style.display = 'block';

    // find/set winner element
    $(".winner span").text(`${result.winner}`);

    // (optional) show player's keyword
    const keywordsList = result.keywords;

    const keywordsTable = document.getElementById('keywordsTable');

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