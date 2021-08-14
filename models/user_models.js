const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const UserSchema = new mongoose.Schema({
    username : {
        type : String ,
        required: [true, "username can't be blank"],
        match: [/^[a-zA-Z0-9]+$/, 'username is invalid'],
        lowercase: true,
        unique: true
    },
    email : { 
        type : String ,
        required: [true, "email can't be blank"],
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'email is invalid'],
        lowercase: true,
        unique: true
    },
    password : {
        type : String ,
        required: [true, "password can't be blank"],
    },
    bio : {
        type : String ,
    },
    token: { 
        type: String
    },
    isActive:{
        type:Boolean ,
        default:false
    },

},{timestamps: true}); //creates a createdAt and updatedAt field on this models which will get automatically updated when our model changes.

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'});

module.exports = mongoose.model('User' , UserSchema);