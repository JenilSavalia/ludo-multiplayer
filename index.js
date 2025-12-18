import express from 'express'
import { WebSocketServer } from 'ws'
import http from "http"

const app = express();
const server = http.createServer(app)
const wss = new WebSocketServer({ server });

class GAME_STATE {

    LAST_DICE_ACTION = {
        player_id: "",
        Value: 0,
    }

    user_map = {
        "id1": "BLUE_COORDINATES",
        "id2": "GREEN_COORDINATES",
        "id3": "YELLOW_COORDINATES",
        "id4": "RED_COORDINATES",
    }

    BLUE_COORDINATES = {
        BLUE_A: 0,
        BLUE_B: 0,
        BLUE_C: 0,
        BLUE_D: 0,
    };
    GREEN_COORDINATES = {
        GREEN_A: 0,
        GREEN_B: 0,
        GREEN_C: 0,
        GREEN_D: 0,
    };
    RED_COORDINATES = {
        RED_A: 0,
        RED_B: 0,
        RED_C: 0,
        RED_D: 0,
    };
    YELLOW_COORDINATES = {
        YELLOW_A: 0,
        YELLOW_B: 0,
        YELLOW_C: 0,
        YELLOW_D: 0,
    };


}


wss.on("connection", async (ws, req) => {
    console.log("Client connected");

    // create a seperate room
    // create new game state instance
    const myRoom = new GAME_STATE();
    console.log(myRoom)
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        console.log("received:", data);

        // {
        //      playerId : "djnsdjfnsdjf",
        //      "message" : "rollDice"
        // }

        if (data.message == "rollDice") {
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            myRoom.LAST_DICE_ACTION = { player_id: data.playerId, Value: diceRoll }

            // broadcast to all
            ws.send(JSON.stringify({ playerId: data.playerId, message: "rollDice", value: diceRoll }));
        }

        // {
        //     "playerId" : "id1",
        //      "message" : "move"
        //      "target" : "BLUE_A"
        // }
        if (data.message == "move") {
            const tmp = myRoom.user_map[data.playerId]
            console.log(tmp)
            console.log(myRoom[tmp])
            myRoom[tmp][data.target] += myRoom.LAST_DICE_ACTION.Value
            // broadcast to all
            ws.send(JSON.stringify({ message: "update coordniates", value: myRoom[tmp][data.target] }))
        }
    })
})

app.get("/health", (req, res) => {
    res.json("I am Healthy");
})

server.listen(3000);    