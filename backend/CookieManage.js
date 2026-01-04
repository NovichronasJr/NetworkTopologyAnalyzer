var jwt = require('jsonwebtoken');
require('dotenv').config();


async function CreateToken(data){
    const token = await jwt.sign(data,process.env.JWT_SECRET,{expiresIn:60*60});
    return token;
}


module.exports=CreateToken;