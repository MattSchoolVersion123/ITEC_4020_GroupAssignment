//Module packages imported
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const websocket = require('ws');

//Middleware for module packages 
const app = express();
app.use(cors());
app.use(express.json());

main().catch(err => console.log(err));
async function main() { 
    await mongoose.connect('mongodb://localhost:27017/chatgpt-evaluation-db')
};

const {Schema} = mongoose; 
const chatgpt_eval_schema = new Schema ({
    question: String,
    expected_answer: String,
    chatgpt_response: String,
    domain: String
});

app.use('/api/add', (req,res,next) => {
    const a = parseInt(req.query.a);
    const b = parseInt(req.query.b);

    if (!a || !b) {
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

app.get('/api/add', (req,res) => {
    const a = req.a + req.b;
    res.json({result});
});

//Add welcome or sum like that for the home page then a please continue 
app.get('/home', (req,res) => {
    res.send('HELLO HOMEPAGE');
});
app.get('/about', (req,res) => {
    res.send("HELLO ABOUT PAGE");
});
app.get('/education', (req,res) => {
    res.send("HELLO EDUCATION");
});
app.get('/experience',(req,res) => {
    res.send('HELLO EXPERIENCE');
});
app.get('/project', (req,res) => {
    res.send('HELLO PROJECT PAGE');
});

