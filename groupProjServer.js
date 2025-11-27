//Module packages imported
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const OpenAI = require('openai');
const WebSocket = require('ws');
require('dotenv').config();

//Ports and AI key 
const port = 3000;
const wsport = 8080;
const dbport = 27017
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

//Creates websocketserver object for ws communication 
const wss = new WebSocket.Server ({port:wsport});
wss.on("connection", (ws) => {
    console.log('You are connected');
    ws.send('This is a websocket test for connection');
    ws.on('message', (message) => {
        console.log("Received message, here it is:",message);
        ws.send('Server received message:' + message)
    });
    ws.on('close', () => {
        console.log('Disconnected')
    });
});
console.log(`Websocket running on ws://localhost:${wsport}`)
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

//RESULTS GET PRINTED 
app.get('/api/results',async (req,res) => {
    const result = await analysis();
    res.json(result);
});

//Tells that the server is running
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})

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
                //Grabs the values from the rows that has been read from the pipeline
                const row_values = Object.values(row);
                //It then pushes the key-value pairs to my array that holds these pairs 
                data_rows.push({
                    question: `${row_values[0]} A: ${row_values[1]} B: ${row_values[2]} C: ${row_values[3]} D: ${row_values[4]} `,
                    expected_answer: row_values[5],
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

const domainModels = [
    {domain: 'History', model: model1},
    {domain: 'Social_Science', model: model2},
    {domain: 'Computer_Security', model: model3}
];

CSVtoDBLoad('computer_security_test.csv','computer_security',model1);
CSVtoDBLoad('prehistory_test.csv',"history",model2);
CSVtoDBLoad('sociology_test.csv','social_science',model3);

//This function calls the analysis every time /api/results is opened
async function analysis() {
    console.log("Starting Analysis...");
    const BATCH_SIZE = 15; 

    try {
        const results = [];
        for (let i = 0; i < 3; i++) {
            const { domain, model } = domainModels[i];
            console.log(`Analyzing ${domain}...`);

            // 1. Get 50 questions
            const documentsInDB = await model.find({}).limit(50);
            const DOCUMENTSINDBCOUNT = documentsInDB.length;

            let totalLatencySum = 0; // The sum of all 50 questions
            let correct = 0;

            // 2. Process in Batches
            for (let j = 0; j < DOCUMENTSINDBCOUNT; j += BATCH_SIZE) {
                const batch = documentsInDB.slice(j, j + BATCH_SIZE);
                
                const batchPromises = batch.map(async (doc) => {
                    const start = Date.now();
                    const answerBack = await openai.chat.completions.create({
                        messages: [
                            { role: 'system', content: "You are a quiz key, only output the letter (A, B, C, or D)..." },
                            { role: 'user', content: doc.question }
                        ],
                        model: "gpt-3.5-turbo",
                        max_tokens: 1 
                    });
                    const latency = Date.now() - start;
                    
                    // Grade and Update
                    const GPTAnswer = answerBack.choices[0].message.content.trim().toUpperCase();
                    const isCorrect = (GPTAnswer === doc.expected_answer.toUpperCase());
                    await model.updateOne({ _id: doc._id }, { $set: { chatgpt_response: GPTAnswer } });

                    return { latency, isCorrect };
                });

                const batchResults = await Promise.all(batchPromises);
                
                // Sum up the time for this batch
                batchResults.forEach(res => {
                    totalLatencySum += res.latency;
                    if (res.isCorrect) correct++;
                });
            }

            // 3. FINAL CALCULATION
            const accuracy = (correct / DOCUMENTSINDBCOUNT) * 100;
            
            // --- THIS IS THE FIX ---
            // We divide the Total Sum (e.g., 16000ms) by the Count (50)
            const calculatedAverage = totalLatencySum / DOCUMENTSINDBCOUNT;
            
            console.log(`Domain: ${domain} | Total Sum: ${totalLatencySum} | Count: ${DOCUMENTSINDBCOUNT} | Avg: ${calculatedAverage}`);

            // Send 'calculatedAverage' but label it 'totalTime' so the Frontend accepts it
            results.push({ domain, accuracy, totalTime: calculatedAverage });
        }
        return results;
    }
    catch (err) {
        console.log("Analysis Error:", err);
        return [];
    }
}



