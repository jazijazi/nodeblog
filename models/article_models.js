const mongoose = require('mongoose');
const path = require('path');
var uniqueValidator = require('mongoose-unique-validator');
const articleImageBasePath = 'uploads/ArticleImage';

const ArticleSchema = new mongoose.Schema({
    title : {
        type:String,
        required:true,
        maxLength:50,
        trim:true,
        unique: true
    },
    author : {
        type : mongoose.Schema.Types.ObjectId , 
        required : true ,
        ref : 'User'
    },
    content : {
        type:String,
        required:true,
        maxLength:250,
    },
    status : {
        type: Number ,
        enum : [0,1,2,3]
    },
    coverImageName : {
        type : String ,
        required : false
    },
},
    {
        timestamps: true ,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

ArticleSchema.virtual('slug').get(function(){
    return this.title.replace(/ /g, "-"); //replace all spaces with dash
});

ArticleSchema.plugin(uniqueValidator, {message: 'is already taken.'});


ArticleSchema.virtual('articleImagePath').get(function(){
   if(this.coverImageName != null){
       return path.join('/' , articleImageBasePath , this.coverImageName);
   }     
});

module.exports = mongoose.model('Article' , ArticleSchema);
module.exports.articleImageBasePath = articleImageBasePath ;