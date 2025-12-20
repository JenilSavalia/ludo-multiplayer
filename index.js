import express from 'express'
import { WebSocketServer } from 'ws'
import http from "http"
import { RED_PATH, YELLOW_PATH, GREEN_PATH, BLUE_PATH, PROTECTED_CELLS } from './deps.js'

const app = express();
const server = http.createServer(app)
const wss = new WebSocketServer({ server });

const COLORS = ["BLUE", "RED", "GREEN", "YELLOW"]
const COLORS_PATH = { "RED": RED_PATH, "BLUE": BLUE_PATH, "GREEN": GREEN_PATH, "YELLOW": YELLOW_PATH }

function initTokens(color) {
    return ["A", "B", "C", "D"].map(c => {
        return {
            tokenId: `${color}_${c}`,
            pathIndex: -1,
            state: "base"
        }
    })
}


class GAME_STATE {

    user_map = new Map();

    mapUser(color, userId) {
        if (COLORS.includes(color)) {
            this.user_map.set(color, userId)
        }
    }

    // normal phase transation
    // DICE → TOKEN → RESOLVE → DICE

    // If extra turn:
    // DICE → TOKEN → RESOLVE → TOKEN


    CURRENT_PHASE = "DICE"

    LAST_DICE_ACTION = {
        Value: 0,
    }

    currentTurnIndex = 0;
    ROll_ORDER = ["BLUE", "RED", "GREEN", "YELLOW"];

    get currentColor() {
        return this.ROll_ORDER[this.currentTurnIndex];
    }


    // token states 
    // "base", "active", "home", "finished"


    TOKENS =
        {
            BLUE: initTokens("BLUE"),
            RED: initTokens("RED"),
            GREEN: initTokens("GREEN"),
            YELLOW: initTokens("YELLOW"),
        }

}


const newGame = new GAME_STATE();


function rollDice() {
    if (newGame.CURRENT_PHASE !== "DICE") return null;
    const random = Math.floor((Math.random() * 6) + 1);
    newGame.LAST_DICE_ACTION.Value = random;
    newGame.CURRENT_PHASE = "TOKEN";
    return random;
}

// finds movable tokens for current color
// args : color , dice (random ganerated number)

// what this function  does is , it returns movable tokens (i.e tokens with active status and tokens on base if dice value id 6)
function findMovableTokens() {

    if (newGame.CURRENT_PHASE !== "TOKEN") return [];

    const dice = newGame.LAST_DICE_ACTION.Value

    return newGame.TOKENS[newGame.currentColor].filter(t => {
        console.log(t)
        return t.state === "active" || (t.state === "base" && dice === 6)
    })

}



// returns token object
function TokenSelection(selectedTokenID, movableTokenList) {
    return movableTokenList.find((t) => t.tokenId === selectedTokenID) || null;
}


// args : token : object
function MoveToken(token) {
    if (!token) return;
    const random_num = newGame.LAST_DICE_ACTION.Value;

    if (token.state === "base") {
        token.state = "active";
        token.pathIndex = 0;
        return;
    }

    const nextIndex = token.pathIndex + random_num;
    if (nextIndex <= 58) {
        token.pathIndex = nextIndex;
        if (nextIndex == 58) {
            token.state = "finished";
        }
    }

}

// args : token : object 
function checkCapture(movedToken) {

    const currentColor = newGame.currentColor;

    // checking if moved token has moved to protected box (i.e star,home,etc)
    if (PROTECTED_CELLS[currentColor].includes(movedToken.pathIndex)) {
        return false;
    }

    const check = COLORS_PATH[currentColor][movedToken.pathIndex]
    // check above {r : , c :} with all 3 other colors, if it gets matched, send enemy its home


    Object.entries(newGame.TOKENS).forEach(([enemyColor, tokens]) => {
        if (enemyColor !== currentColor) {
            tokens.forEach(obj => {

                if (obj.pathIndex !== -1) {
                    const { r, c } = COLORS_PATH[enemyColor][obj.pathIndex];

                    if (check.r == r && check.c == c) {
                        obj.state = "base";
                        obj.pathIndex = -1;
                        return true;
                    }
                }

            })
        }

    })
    return false
}

function advancedTurn(extraTurn) {
    if (!extraTurn) {
        newGame.currentTurnIndex = (newGame.currentTurnIndex + 1) % 4;
        newGame.CURRENT_PHASE = "DICE";
    } else {
        newGame.CURRENT_PHASE = "TOKEN";
    }

}


newGame.mapUser("RED", "id1");
newGame.mapUser("YELLOW", "id2");
newGame.mapUser("BLUE", "id3");
newGame.mapUser("GREEN", "id4");


function play(selectedTokenId) {

    const dice = rollDice();
    if (dice == null) return;

    const movable = findMovableTokens();

    if (movable?.length === 0) {
        // incremants the index to next turn;
        advancedTurn(false);
        return;
    }


    const selectedToken = TokenSelection(selectedTokenId, movable);

    MoveToken(selectedToken);

    const kill = checkCapture(selectedToken);

    const extraTurn = kill || dice === 6;

    advancedTurn(extraTurn);

}





let roomId = 100;

// RoomId: {
// users: new Set(),
// roomSize: 0
// }
const rooms = new Map();


wss.on("connection", async (ws, req) => {
    console.log("Client connected");
    const params = new URLSearchParams(req.url.replace("/", ""));
    const roomId = params.get("roomId");

    const room = rooms.get(Number(roomId))

    if (!room) {
        ws.close(1008, "Missing room");
        return;
    }

    if (room.roomSize > 5) {
        ws.close(1008, "Room Full");
        return;
    }
    room.users.add(ws);
    room.roomSize++;

    ws.on("message", (message) => {
        const { msg } = JSON.parse(message);
        rooms.get(Number(roomId)).users.forEach(user => {
            if (user != ws)
                user.send(msg)
        })
    })

    ws.on("close", () => {
        // send message too other users in room , that this clienst has disconnected
        room.users.delete(ws);
        room.roomSize--;
    })
})


app.get("/create-multiplayer-room", (req, res) => {
    try {
        roomId++;
        rooms.set(roomId, {
            users: new Set(),
            roomSize: 0
        })
        return res.json({
            roomId: roomId,

        })
    } catch (error) {
        return res.status(500).send("Internal Server Error", e.message)
    }
})

app.get("/health", (req, res) => {
    res.json("I am Healthy");
})

server.listen(3000);    