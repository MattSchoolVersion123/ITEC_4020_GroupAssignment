//Module packages imported
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const websocket = require('ws').Server;
const csv = require('csv-parser');
const fs = require('fs');

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
    console.log(`Server running on http://localhost:${port}`)
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

//Creates an asynchronous function for CSV readability to DB loading
async function CSVtoDBLoad(file,domain,model) {
    //Firstly creates "data_rows": empty array to collect the objects from the key-value pairing    
    const data_rows = [];
    return new Promise((resolve, reject) => {
        //Creates a stream of chunks of the file its passed
        fs.createReadStream(file)
            //Creates the flow of readable data and removes the csv headers so it doesnt auto create incorrect headers
            .pipe(csv({headers: false}))
            //This chunk takes the data {as an object} that is given from the pipeline and makes it manipulable 
            .on('data',(row) => {
                //To formulate the answer we must find the key to that answer
                let key_find = '';
                if (row['5']) { 
                    key_find = row['5'].trim().toUpperCase()
                }else {key_find=null;}
                //Create a case switch to determine which key is right
                expected_answer_field = '';
                switch(key_find) {
                    case 'A' : expected_answer_field = row['1']; break;
                    case 'B': expected_answer_field = row['2']; break;
                    case 'C': expected_answer_field = row['3']; break;
                    case 'D': expected_answer_field = row['4']; break;
                }
                
                //It then pushes the key-value pairs to my array that holds these pairs 
                data_rows.push({
                    question: row[0],
                    expected_answer: expected_answer_field,
                    chatgpt_response: "",
                    domain: domain
                });
            })
            //Asynchronously, we also add these into my db and if it fails it will display 
            .on('end',async() => {
                try {
                    //Firstly if i already ran my backend this will check if there is any docs in my db
                    const filledDataBaseCheck = await model.countDocuments({});
                    //Any count in my check above zero will just return nothing and just skip the inserts
                    
                    if (filledDataBaseCheck > 0) {console.log('DETECTED DATA: SKIP INSERT'); return resolve();}

                    await model.insertMany(data_rows);
                    console.log(`${domain}, has been loaded into your db`);
                    resolve();
                }
                catch(err) {
                    reject(err);
                    console.log('Unsucessfully loaded into db');
                }
            })
    })
}

const model1 = mongoose.model('Computer_eval',chatgpt_eval_schema,'computer_security');
const model2 = mongoose.model('pre_hist_eval',chatgpt_eval_schema,'history');
const model3 = mongoose.model('sociology_eval',chatgpt_eval_schema,'social_science');

CSVtoDBLoad('computer_security_test.csv','computer_security',model1);
CSVtoDBLoad('prehistory_test.csv',"history",model2);
CSVtoDBLoad('sociology_test.csv','social_science',model3);

