const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const auth = require("./middleware/auth");
const Article = require("../models/article_models");
const User = require("../models/user_models");

//add multer for upload
const ArticleImageuploadPath = path.join('public' , Article.articleImageBasePath);
const imageMimeType = ['image/jpeg' , 'image/png' , 'image/jpg'];
const upload = multer({
    dest : ArticleImageuploadPath ,
    fileFilter : (req , file , callback) => {
        callback( null , imageMimeType.includes(file.mimetype))
    },
    limits: { fileSize: 500 * 1000 },
});

router.get('/', async(req, res) => {
    let query = Article.find().sort('-updatedAt');

    if(req.query.title != null && req.query.title != ''){
        query = query.regex('title' , new RegExp(req.query.title , 'i'));
    }
    if(req.query.createdBefore != null && req.query.createdBefore != ''){
        query = query.lte('createdAt' , req.query.createdBefore);
    }
    if(req.query.createdAfter != null && req.query.createdAfter != ''){
        query = query.gte('createdAt' , req.query.createdAfter);
    }
    //Paginate query
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)

    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const results = {}
    count_all = await query.countDocuments().exec();
    
    if (endIndex < count_all) {
        results.next = {
          page: page + 1,
          limit: limit
        }
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }

    results.allpage = count_all % limit == 0 ? count_all / limit : Math.floor(count_all / limit + 1) ;

    try{
        results.results = await query.find().limit(limit).skip(startIndex).exec()
        res.paginatedResults = results
        
        res.json(res.paginatedResults);
    }
    catch(err){
        res.status(400).json({"message":"error in get all articles"});
        console.log(err);
    }
});

router.get('/:id' , async(req , res) => { 
    try{
        const article = await Article.findById(req.params.id).populate({ path: 'author', select: 'username bio' }).exec() ; 
        if(!article){
            res.status(404).json({"message":"article not exist!"});
        }
        res.json(article);
    }
    catch(err){
        res.status(400).json({"message":"error in get this book"});
        console.log(err);
    }
});

router.post('/' , auth ,async(req , res)=>{
    
    const {title , content} = req.body ;
    if(!(title && content)){
        res.status(400).json({"message":"title and content are required"});
    }

    const author = await User.findById(req.user.user_id);
    if(!author){
        res.status(400).json({"message":"please login for write a post"});
    }

    try{
        const article = await Article.create({
            title:title,
            content:content,
            author:author,
            status:1
        });
        res.status(201).json(article);
    }
    catch(err){
        res.status(400).json({"messaage":err.message});
        console.log(err)
    }

});

router.put('/:id/image' , [auth,upload.single('image')] ,async(req , res)=>{
    const fileName = req.file != null ? req.file.filename : null ;
 
    try{
        //Get article
        const article = await Article.findById(req.params.id) 
        if(!article){
            res.status(404).json({"message":"article not exist!"});
        }
        //Get user
        const user = await User.findById(req.user.user_id);
        if(!user){
            res.status(401).json({"message":"please login for edit a post"});
        }
        //add image
        if(user.id == article.author){
            article.coverImageName = fileName ;
            await article.save();
            res.status(200).json(article);
        }
        else{
            res.status(403).json({"message":"you are not allow to edit this post"});
        }
    }
    catch(err){
        removeArticleImage(fileName);
        res.status(400).json({"messaage":err.message});
        console.log(err)
    }
});

router.put('/:id' , auth , async (req , res)=>{
    const {title , content} = req.body ;
    if(!(title && content)){
        res.status(400).json({"message":"title and content are required for update"});
    }

    try{
        //Get article
        const article = await Article.findById(req.params.id) 
        if(!article){
            res.status(404).json({"message":"article not exist!"});
        }
        //Get user
        const user = await User.findById(req.user.user_id);
        if(!user){
            res.status(401).json({"message":"please login for write a post"});
        }
        //Check user eq auhtor of this article
        if(user.id == article.author){
            article.title = title ;
            article.content = content ;
            await article.save();
            res.status(200).json(article);
        }
        else{
            res.status(403).json({"message":"you are not allow to edit this post"});
        }
    }
    catch(err){
        res.status(400).json({"messaage":err.message});
        console.log(err)
    }
});

router.delete('/:id' , auth , async(req , res)=>{
    try{
        //Get article
        const article = await Article.findById(req.params.id) 
        if(!article){
            res.status(404).json({"message":"article not exist!"});
        }
        //Get user
        const user = await User.findById(req.user.user_id);
        if(!user){
            res.status(401).json({"message":"please login for delete a post"});
        }
        //Check user eq auhtor of this article
        if(user.id == article.author){
            removeArticleImage(article.coverImageName);
            await article.remove()
            res.status(200).json({"message":"article deleted"})
        }
        else{
            res.status(403).json({"message":"you are not allow to delete this post"});
        }
    }
    catch(err){
        res.status(400).json({"messaage":err.message});
        console.log(err)
    }   
});


function removeArticleImage(fileName){
    fs.unlink(path.join(ArticleImageuploadPath , fileName) , err =>{
        if(err) console.error(err);
    })
}

module.exports = router;