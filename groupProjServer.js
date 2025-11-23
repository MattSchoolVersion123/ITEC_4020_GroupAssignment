//Module packages imported
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const websocket = require('ws').Server;
//Ports
const port = 3000;
const wsport = 8080;
const dbport = 27017

//Creates websocketserver object for ws communication 
const wss = new WebSocketServer({port: wsport})

//Creates express app object
const app = express();

//Allows front-end hosting
app.use(cors());
//Parses request bodies into the json format
app.use(express.json());


//PART ONE: WEBSITE DEVELOPMENT & HOSTING [BACKEND]


//Creates route to /api/add so that it can use the addition validation logic
app.use('/api/add', (req,res,next) => {
    const a = parseInt(req.query.a);
    const b = parseInt(req.query.b);

    if (req.query.a === undefined || req.query.b === undefined) {
        return res.status(400).send('A and B are empty');
    }
    else if (isNaN(a) || isNaN(b))
    {
        return res.status(400).send('A or B is not a number');
    }
    req.a = a;
    req.b = b;
    next();
});

//It will then return as such 
app.get('/api/add', (req,res) => {
    const result = req.a + req.b;
    res.json({result});
});

//Get route to serve to home page 
app.get('/', (req,res) => {
    res.redirect('/home');
})

//Home Page
app.get('/home', (req,res) => {
    res.send('HELLO HOMEPAGE');
});
//About Page
app.get('/about', (req,res) => {
    res.send("HELLO ABOUT PAGE");
});
//Education Page
app.get('/education', (req,res) => {
    res.send("HELLO EDUCATION");
});
//Experience Page
app.get('/experience',(req,res) => {
    res.send('HELLO EXPERIENCE');
});
//Project Page [This is where we'll show the database analysis]
app.get('/project', (req,res) => {
    res.send('HELLO PROJECT PAGE');
});


//Tells that the server is running
app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`)
})

//Enables websocket connection and awaits for instruction [Need front-end to enchance websocket]
wss.on('connection', function (ws) { 
    console.log('Connected to client')
    ws.send("Connected to Server");
    ws.on('message', function(message){
        console.log(message);
        console.log(message.toString('ascii'));
    });
});


//PART TWO: CHATGPT: EFFICIENCY EVALUATION [BACKEND]


//If main() has an error it will display err in console log
main().catch(err => console.log(err));

//Creates an async func to start connection to mongodb
async function main() { 
    await mongoose.connect(`mongodb://localhost:${dbport}/chatgpt-evaluation-db`);
};

//Generates schema for mongo db 
const {Schema} = mongoose; 
const chatgpt_eval_schema = new Schema ({
    question: String,
    expected_answer: String,
    chatgpt_response: String,
    domain: String
});

