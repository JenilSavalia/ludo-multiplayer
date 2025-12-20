import express from 'express'
import { WebSocketServer } from 'ws'
import http from "http"
import { RED_PATH, YELLOW_PATH, GREEN_PATH, BLUE_PATH, PROTECTED_CELLS } from './deps.js'

const app = express();
const server = http.createServer(app)
const wss = new WebSocketServer({ server });

const COLORS = ["BLUE", "RED", "GREEN", "YELLOW"]
const COLORS_PATH = { "RED": RED_PATH, "BLUE": BLUE_PATH, "GREEN": GREEN_PATH, "YELLOW": YELLOW_PATH }

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

    // token states 
    // "base", "active", "home", "finished"

    TOKENS =
        {
            BLUE: [
                {
                    tokenId: "BLUE_A",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "BLUE_B",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "BLUE_C",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "BLUE_D",
                    pathIndex: -1,
                    state: "base"
                },
            ]
            ,
            GREEN: [
                {
                    tokenId: "GREEN_A",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "GREEN_B",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "GREEN_C",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "GREEN_D",
                    pathIndex: -1,
                    state: "base"
                },
            ],
            RED: [
                {
                    tokenId: "RED_A",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "RED_B",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "RED_C",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "RED_D",
                    pathIndex: -1,
                    state: "base"
                },
            ],
            YELLOW: [
                {
                    tokenId: "YELLOW_A",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "YELLOW_B",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "YELLOW_C",
                    pathIndex: -1,
                    state: "base"
                },
                {
                    tokenId: "YELLOW_D",
                    pathIndex: -1,
                    state: "base"
                },
            ]
        }

}


const newGame = new GAME_STATE();


function mapUser(color, userId) {
    newGame.mapUser(color, userId);
}

// function currentUserTurn() {
//     const color = newGame.ROll_ORDER[newGame.currentTurnIndex]
//     const userRollOrder = newGame.user_map.get(color)
//     console.log("Current Color Turn : ", color, " ", "user Id:", userRollOrder)
//     return userRollOrder;
// }

function rollDice() {
    const random = Math.floor((Math.random() * 6) + 1);
    newGame.LAST_DICE_ACTION.Value = random;

    return random;
}

// finds movable tokens for current color
// args : color , dice (random ganerated number)

// what this function  does is , it returns movable tokens (i.e tokens with active status and tokens on base if dice value id 6)
function findMovableTokens() {
    const currentColor = newGame.ROll_ORDER[newGame.currentTurnIndex]
    const random_num = newGame.LAST_DICE_ACTION.Value

    return newGame.TOKENS[currentColor].find(t => {
        console.log(t)
        if (t.state == "base" && random_num == 6) {
            return true;
        }
        if (t.state == "active") {
            return true
        }
        return false;
    })

}



// returns token object
function TokenSelection(selectedTokenID) {

    const currentColor = newGame.ROll_ORDER[newGame.currentTurnIndex];
    const isValid = newGame.TOKENS[currentColor].find(t => t.tokenId == selectedTokenID);

    // check if given tokenID is valid and movable 
    if (isValid && movableTokenList.find(t => t.tokenId == selectedTokenID)) {
        return isValid;
    }
    return false;
}


// args : token : object
function MoveToken(token) {
    const currentColor = newGame.ROll_ORDER[newGame.currentTurnIndex];
    const random_num = newGame.LAST_DICE_ACTION.Value;


    if (token.status === "base" && random_num === 6) {

        newGame.TOKENS[currentColor].map(t => {
            if (t.tokenId == token.tokenId) {
                t.state = "active"
                t.pathIndex = 0;
                return;
            }
        })
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

    const currentColor = newGame.ROll_ORDER[newGame.currentTurnIndex];

    // checking if moved token has moved to protected box (i.e star,home,etc)
    if (PROTECTED_CELLS[currentColor].includes(movedToken.pathIndex)) {
        return;
    }

    const check = COLORS_PATH[currentColor][movedToken.pathIndex]
    // check above {r : , c :} with all 3 other colors, if it gets matched, send enemy its home


    Object.entries(newGame.TOKENS).map(([enemyColor, tokens]) => {
        if (enemyColor !== currentColor) {
            tokens.map(obj => {
                const { r, c } = COLORS_PATH[enemyColor][obj.pathIndex];
                // console.log(COLORS_PATH[key][obj.pathIndex])

                if (check.r == r && check.c == c) {
                    obj.pathIndex = 0;
                    obj.state = "base";
                    return true;
                }

            })
        }
        return false

    })
}

function advancedTurn(extraTurn) {
    if (!extraTurn) {
        newGame.currentTurnIndex = (currentTurnIndex + 1) % 4;
    }
}


// mapUser("RED", "id1");
// mapUser("YELLOW", "id2");
// mapUser("BLUE", "id3");
// mapUser("GREEN", "id4");


// const diceValue = rollDice();

// const movableTokens = findMovableTokens()

// // user selects  token here .........

// const selectedToken = TokenSelection("Selected Token ID", movableTokens.ActiveTokens, movableTokens.BaseTokens)

// const moveTokens = MoveToken(selectedToken.selectedToken, selectedToken.status)

// const tokenCheck = safeCheck(moveTokens);

// const killHappened = checkCapture(tokenCheck)

// if (killHappened.killHappened === true) {
//     rollDice()
// }













// wss.on("connection", async (ws, req) => {
//     console.log("Client connected");

//     // create a seperate room
//     // create new game state instance
//     const myRoom = new GAME_STATE();
//     // console.log(myRoom)
//     console.log(checkCollison("BLUE", "BLUE_A", myRoom))
//     ws.on("message", (message) => {
//         const data = JSON.parse(message);
//         console.log("received:", data);

//         // {
//         //      playerId : "djnsdjfnsdjf",
//         //      "message" : "rollDice"
//         // }

//         if (data.message == "rollDice") {
//             const diceRoll = Math.floor(Math.random() * 6) + 1;
//             myRoom.LAST_DICE_ACTION = { player_id: data.playerId, Value: diceRoll }

//             // broadcast to all
//             ws.send(JSON.stringify({ playerId: data.playerId, message: "rollDice", value: diceRoll }));
//         }

//         // {
//         //     "playerId" : "id1",
//         //      "message" : "move",
//         //      "target" : "BLUE_A",
//         //      "color"  : "BLUE"
//         // }

//         if (data.message == "move") {
//             const tmp = myRoom.user_map[data.playerId]
//             myRoom[tmp][data.target] += myRoom.LAST_DICE_ACTION.Value

//             //check collision 


//             // broadcast to all
//             ws.send(JSON.stringify({ message: "update coordniates", value: myRoom[tmp][data.target] }))
//         }
//     })
// })

app.get("/health", (req, res) => {
    res.json("I am Healthy");
})

server.listen(3000);    