const jwt = require("jsonwebtoken");

const verifyToken = (req , res , next) => {
    
    const token = req.body.token || req.query.token || req.headers["x-access-token"];

    // req.query.token is not safe use Bearer token 
    //const authHeader = req.headers['authorization']
    //const bearertoken = authHeader && authHeader.split(' ')[1]


    if (!token) {
        return res.status(403).json({"message":"A token is required for authentication"});
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.user = decoded; //add this to req for authentication >> use (req.user.user_id) !
    }
    catch (err) {
        return res.status(401).json({"message":"Invalid Token"});
    }
    return next();
};

module.exports = verifyToken;