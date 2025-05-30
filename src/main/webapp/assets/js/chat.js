let chatSocket = null;
let mySessionId = null;

// 메시지를 DOM에 추가
function appendChatMessage(text, direction) {
    const chatDisplay = document.getElementById("chat_display_el");
    const row = document.createElement("div");
    const msg = document.createElement("div");

    if (direction === "system") {
        row.className = "chat_row system";
        msg.className = "chat_message system";
        msg.innerHTML = text;
        row.appendChild(msg);
    } else {
        row.className = `chat_row ${direction}`;
        msg.className = `chat_message ${direction}`;
        msg.innerHTML = text;

        const icon = document.createElement("div");
        icon.className = "profile_icon";

        if (direction === "right") {
            row.appendChild(msg);
            row.appendChild(icon);
        } else {
            row.appendChild(icon);
            row.appendChild(msg);
        }
    }

    chatDisplay.appendChild(row);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// 메시지 전송
function sendChatMessage() {
    const input = document.getElementById("chat_input");
    const msg = input.value.trim();

    if (msg !== "") {
        if (chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(msg);
        } else {
            alert("서버와 연결되어 있지 않습니다.");
        }
        input.value = "";
    }
}

// 웹소켓 초기화 및 이벤트 바인딩
function initChatSocket() {
    const roomId = new URLSearchParams(window.location.search).get("roomId");
    chatSocket = new WebSocket("wss://" + location.host + "/eggsinthetray/chat/" + roomId);

    chatSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
            mySessionId = data.sessionId;
            return;
        }

        if (data.type === "system") {
            appendChatMessage(data.message, "system");
            return;
        }

        const direction = data.senderId === mySessionId ? "right" : "left";
        appendChatMessage(data.message, direction);
    };

    document.querySelector(".send_btn").addEventListener("click", sendChatMessage);
    document.getElementById("chat_input").addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendChatMessage();
        }
    });



    // 시스템 초기 메시지 표시
    appendChatMessage("[시스템] 게임이 시작되었습니다.", "system");
}


/* --------------------
        프로필
-------------------- */
let profileSocket = null;

// 승률 계산
function calculateWinRate(wins, losses) {
    const total = wins + losses;
    return total === 0 ? 0 : Math.round((wins / total) * 100);
}

// 프로필 렌더링
function renderProfile({ selector, level, name, wins, losses, eggType }) {
    const frame = document.querySelector(selector);
    frame.querySelector('.profile_level').textContent = `LV ${level}`;
    frame.querySelector('.profile_name').textContent = name;
    frame.querySelector('.profile_record').textContent = `${wins}W ${losses}L`;

    const winRate = calculateWinRate(wins, losses);
    frame.querySelector('.profile_win_rate').textContent = `(${winRate}%)`;

    frame.querySelector('.profile_egg_text').textContent =
        eggType === 'White' ? '백돌' :
            eggType === 'Black' ? '흑돌' : eggType;
}

// 프로필 웹소켓 연결
function initProfileSocket() {
    const roomId = new URLSearchParams(window.location.search).get("roomId");
    profileSocket = new WebSocket("ws://" + location.host + "/eggsinthetray/profile/" + roomId);

    profileSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.type === "white") {
            renderProfile({
                selector: '.content_profile_frame.white',
                level: data.level,
                name: data.name,
                wins: data.wins,
                losses: data.losses,
                eggType: 'White'
            });
        } else if (data.type === "black") {
            renderProfile({
                selector: '.content_profile_frame.black',
                level: data.level,
                name: data.name,
                wins: data.wins,
                losses: data.losses,
                eggType: 'Black'
            });
        }
    };
}


window.addEventListener("load", initChatSocket);
window.addEventListener("load", initProfileSocket);
