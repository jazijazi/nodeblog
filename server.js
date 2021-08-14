if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

const http = require('http');
const redis = require("redis");
const asyncRedis = require("async-redis");
const nodemailer = require("nodemailer");

const express = require('express');
const app = express();
const router = express.Router();
//const bodyParser = require('body-parser');//deprecated
app.use(express.urlencoded({extended: true}));
app.use(express.json()) // To parse the incoming requests with JSON payloads

//Add Routers
const usersRouter = require('./routes/users');
const articlesRouter = require('./routes/articles');

//Config Database
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI , {useNewUrlParser : true , useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);
const db = mongoose.connection ;
//db.on('err' , error => console.error(error));
db.once('open' , () => console.log('Connect to MongoDB'));


//Config Redis
const redisClient = asyncRedis.createClient({ host:process.env.REDIS_HOST , port:process.env.REDIS_PORT });
redisClient.on("error", function(error) {
  console.error(error);
});
redisClient.on("ready", function(error) {
  console.error("Redis Client Is Connected");
});

//Config Email
async function email_config(){
  try{
    let testAccount = await nodemailer.createTestAccount(); // Only for testing
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email", // Only for testing
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user // Only for testing
        pass: testAccount.pass, // generated ethereal password // Only for testing
      },
    });
    transporter.verify(function(error, success) {
      if (error) {
           console.log(error);
      } else {
           console.log('Email Server Is Ready');
      }
   });
    module.exports.transporter = transporter ;
  } 
  catch(err){
    console.log(err);
  } 
}
email_config();



module.exports.redisClient = redisClient ;


//Config Routers
app.get('/', (req, res) => {
    res.send('<h1>A Simple Api With Nodej MongoDb</h1>')
})
app.use('/users', usersRouter);
app.use('/articles', articlesRouter);



app.listen(process.env.PORT);
