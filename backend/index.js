const express = require('express')
const app  = express();
const connectDB = require('./Connection')
const user_model = require('./models/UserModel');
const CreateToken = require('./CookieManage');
const cors = require('cors');

const PORT = 8003;


connectDB();

app.use(cors({
    origin: 'http://localhost:3000', // 1. Must be the exact URL of your frontend
    credentials: true,               // 2. Allows cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}))
app.use(express.json());
app.use(express.urlencoded({extended:true}))


app.get('/',(req,res)=>{
    return res.status(200).end(`<h1>Network Topology Visualizer Backend</h1>`)
})

// create user route....
app.post('/user',async (req,res)=>{
    // const user_name = "Test"
    // const user_email = "test@gmail.com"
    // const password = "test@123456"

    // const response = await user_model.create({
    //     user_name,
    //     user_email,
    //     password
    // })

    const response = await user_model.create(req.body);
    if(response.length > 0) return res.status(200).json({message:'ok'});
    else return res.status(500).json({message:'error'})
    
})

// login user route (JWT and session etc needs to be implemented)
app.post('/check-user',async(req,res)=>{
    const {email,password} = req.body;
    console.log(email);
    console.log(password);

    const user = await user_model.findOne({user_email:email}).select('+password');
    if(!user) return res.status(401).json({message :"user not exists"});

    const isMatch = await user.comparePassword(password);
    console.log(isMatch);
    if(!isMatch) return res.status(401).json({message:"invalid email or password"});
    else{
        const token = await CreateToken({
            user_name : user.user_name,
            user_email : user.user_email,
        })
        console.log(token);
        if(token) res.status(200).json({token});
        else res.status(500).json({message:'error'});
    }
})

app.patch('/forgotPassword',async(req,res)=>{
    const {email,new_password} = req.body;
    const user = await user_model.findOne({user_email:email});
    if(!user) return res.status(401).json({message:"invalid user"});
    
    user.password = new_password;
    const saved_user = await user.save();
    return res.status(200).json({saved_user});
})

app.listen(PORT,()=>{
    console.log(`backend is listening at :: http://localhost:${PORT}`);
})