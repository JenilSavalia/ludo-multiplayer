import express from 'express'
import { WebSocketServer } from 'ws'
import http from "http"
import { RED_PATH, YELLOW_PATH, GREEN_PATH, BLUE_PATH, PROTECTED_CELLS } from './deps.js'

const app = express();
const server = http.createServer(app)
const wss = new WebSocketServer({ server });

const COLORS = ["BLUE", "RED", "GREEN", "YELLOW"]

class GAME_STATE {

    user_map = new Map();

    mapUser(color, userId) {
        if (COLORS.includes(color)) {
            this.user_map.set(color, userId)
        }
    }


    LAST_DICE_ACTION = {
        player_id: "",
        Value: 0,
        LAST_UPDATED_INDEX: "",
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
mapUser("RED", "id1");
mapUser("YELLOW", "id2");
mapUser("BLUE", "id3");
mapUser("GREEN", "id4");

function currentUserTurn() {
    const color = newGame.ROll_ORDER[newGame.currentTurnIndex]
    const userRollOrder = newGame.user_map.get(color)
    console.log("Current Color Turn : ", color, " ", "user Id:", userRollOrder)
    return userRollOrder;
}


function rollDice() {
    const random = Math.floor((Math.random() * 6) + 1);
    currentUserTurn();

    // let count = 0;
    if (random === 6) {
        newGame.LAST_DICE_ACTION.Value = 6;
        console.log(6)
    } else {
        newGame.LAST_DICE_ACTION.Value = random;
        newGame.LAST_DICE_ACTION.LAST_UPDATED_INDEX = newGame.currentTurnIndex;
        newGame.currentTurnIndex = (newGame.currentTurnIndex + 1) % 4;
        console.log(random)
    }

    return random;
}

rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)
rollDice(newGame)

// finds movable tokens for current color

function findMovableTokens() {
    const currentColor = newGame.ROll_ORDER[newGame.LAST_DICE_ACTION.LAST_UPDATED_INDEX]

    const ActiveTokens = [];
    const BaseTokens = [];

    newGame.TOKENS[currentColor].map(t => {
        if (t.state == "base") {
            BaseTokens.push(t.tokenId)
        } else if (t.state == "active") {
            ActiveTokens.push(t.tokenId)
        }
    })

    return { ActiveTokens, BaseTokens }

}



console.log(findMovableTokens())


function TokenSelection(selectedToken) {
    const { ActiveTokens, BaseTokens } = findMovableTokens();

    // Validate chosen token belongs to player
    const currentColor = newGame.ROll_ORDER[newGame.currentTurnIndex];
    const isValid = newGame.TOKENS[currentColor][selectedToken];

    if (isValid) {
        if (ActiveTokens.includes(isValid)) {
            // Apply Movement
            MoveToken(selectedToken, "active")
        } else if (BaseTokens.includes(isValid)) {
            // Apply Movement
            MoveToken(selectedToken, "base")
        }
    }
}

function MoveToken(tokenId, status) {
    if (status === "base" && newGame.LAST_DICE_ACTION.Value === 6) {
        // get last color rolled
        const color = newGame.ROll_ORDER[newGame.LAST_DICE_ACTION.LAST_UPDATED_INDEX];

        TOKENS[color].map(t => {
            if (t.tokenId == tokenId) {
                if (pathIndex <= 51) {
                    t.pathIndex = 6;
                    t.state = "active"
                }
            }
        })
    } else if (status === "active") {
        // get last color rolled
        const color = newGame.ROll_ORDER[newGame.LAST_DICE_ACTION.LAST_UPDATED_INDEX];

        TOKENS[color].map(t => {
            if (t.tokenId == tokenId) {
                if (pathIndex += newGame.LAST_DICE_ACTION.Value <= 58) {
                    t.pathIndex += newGame.LAST_DICE_ACTION.Value;
                    if (t.pathIndex == 58) {
                        t.status = "finished"
                    }
                }
            }
        })

    }

    

}


function safeCheck(){
    
}









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