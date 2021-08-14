const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auth = require("./middleware/auth");
const User = require("../models/user_models");

const server = require('../server.js');
const nodemailer = require("nodemailer");

router.post("/register", async(req, res) => {
    //const session = await User.startSession();
    try {
        //get user input
        const {username , email , password , bio} = req.body;
        if(!(username && email && password)){
            res.status(400).send("username/email/password is required");
        }

        const oldUser = await User.findOne({ username });
        if (oldUser) {
        return res.status(409).send("User Already Exist!");
        }

        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);
        
        //session.startTransaction();

        const user = await User.create({
            username:username,
            email:email,
            password: encryptedPassword,
            bio:bio,
            isActive:false,
        }); //{ session: session }

        activate_token = crypto.randomBytes(36).toString('hex');
        console.log(activate_token);
        await server.redisClient.set(activate_token , user.id , 'EX' , 60*60*4);
        
        console.warn(`Activate Token For User ${user.usernaem} is : ${activate_token}`)

        //Send Active Token with email
        active_url_path = req.protocol + '://' + req.get('host') + '/users/activate/' + activate_token; 
        let sent_email = await server.transporter.sendMail({
            from: '<nodeblog@example.com>',
            to: "<user.email@gmail.com>",
            subject: "Active NodeBlog Account",
            text: "Please Active Your Account",
            html:  `<h1>Hello ${user.username}</h1>
                    <p>this email for verify your email address</p>
                    <a href="${active_url_path}">Click here<a/>`
        });
        console.log("Message sent: %s", sent_email.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(sent_email)); // Only for testing

        //await session.commitTransaction();
        //session.endSession();

        res.status(201).json(user);

    } catch (err) {
        //await session.abortTransaction();
        //session.endSession();
        res.status(400).json({"message":"error in create user"});
        console.log(err)
    }

});


router.get('/activate/:token' , async(req,res)=>{
    try{
        activate_token = req.params.token ;
        if(!activate_token){
            res.status(400).json({"message":"activate token is reqired"});
        }
        
        let user_id = await server.redisClient.get(activate_token);
        
        if(!user_id){
            res.status(400).json({"message":"Token Not Valid"});
        }

        user = await User.findById(user_id);
        if(!user){
            res.status(404).json({"message":"Use Not Found"});
        }
        user.isActive = true ; 
        await user.save();

        res.status(200).send('<h2>Your Account is active Now Please Login...</h2>');
    }
    catch(err){
        res.status(400).json({"message":"error in active user"});
        console.log(err);
    }
});

router.post("/login", async (req, res) => {
    try{
        const {username , password} = req.body;

        if (!(username && password)){
            res.status(400).send("All input is required");
        }

        const user = await User.findOne({username})

        //if(user && (await bcrypt.compare(password , user.password))){
        if(user && user.isActive && (await bcrypt.compare(password , user.password))){
            const token = jwt.sign(
                {user_id : user.id},
                process.env.TOKEN_KEY ,
                {expiresIn:"2h"}
            );
            user.token = token;
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");
    }
    catch(err){
        console.log(err);
    }

});

router.put('/:id' , auth , async (req , res)=>{
    const {username , bio} = req.body ;
    if(!(username && bio)){
        res.status(400).json({"message":"username and bio are required for update"});
    }

    try{
        user = await User.findById(req.params.id)
        if(!user){
            res.status(404).json({"message":"user not exist!"});
        }
        
        if(user.id == req.user.user_id){
            user.username = username ;
            user.bio = bio ;
            await user.save();
            res.status(200).json(user);
        }
        else{
            res.status(403).json({"message":"you are not allow to edit this user data"});
        }
    }
    catch(err){
        res.status(400).json({"messaage":err.message});
        console.log(err)
    }

});

router.patch('/:id/changepassword' , auth , async (req , res)=>{
    newpassword = req.body.newpassword ;
    if(!(newpassword)){
        res.status(400).json({"message":"newpassword are required for update"});
    }

    try{
        user = await User.findById(req.params.id)
        if(!user){
            res.status(404).json({"message":"user not exist!"});
        }

        if(user.id == req.user.user_id){
            encryptedNewPassword = await bcrypt.hash(newpassword, 10);
            user.password = encryptedNewPassword ;
            
            const token = jwt.sign(
                { user_id: user._id },
                process.env.TOKEN_KEY,
                {expiresIn: "2h",}
            );
            user.token = token;
            
            await user.save();
            res.status(200).json(user);
        }
        else{
            res.status(403).json({"message":"you are not allow to edit this user data"});
        }

    }
    catch(err){
        res.status(400).json({"messaage":err.message});
        console.log(err)       
    }
});

/*
router.get("/allusers" ,async(req, res) => {
    try{
        const users = await User.find().exec()
        res.json(users)
    }
    catch(err){
        console.log(err)
        res.status(400).json({"message":"error in get users"});
    }
});
*/


module.exports = router;