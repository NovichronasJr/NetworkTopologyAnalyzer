const express = require('express')
const app  = express();
const connectDB = require('./Connection')
const user_model = require('./models/UserModel');
const local_scan_model = require('./models/LocalScanModel');
const CreateToken = require('./CookieManage');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = 8003;

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Creates a unique filename: timestamp-originalName
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


connectDB();

app.use(cors({
    origin: 'http://localhost:3000', // 1. Must be the exact URL of your frontend
    credentials: true,               // 2. Allows cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}))
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use('/uploads', express.static('uploads'));

app.get('/',(req,res)=>{
    return res.status(200).end(`<h1>Network Topology Visualizer Backend</h1>`)
})

// create user route....
app.post('/register-user',async (req,res)=>{
    // const user_name = "Test"
    // const user_email = "test@gmail.com"
    // const password = "test@123456"

    // const response = await user_model.create({
    //     user_name,
    //     user_email,
    //     password
    // })
    try{
        const response = await user_model.create(req.body);
        return res.status(200).json({message:'ok',response});
    }catch(err)
    {
        return res.status(500).json({message:err.message});
    }
     
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


// get profile data ---->
app.get('/api/profile/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        const user = await user_model.findOne({ user_email: userEmail });
        
        if (!user) return res.status(404).json({ message: "User not found" });

        const profileData = {
            fullName: user.user_name,
            email: user.user_email,
            phone: user.phone || '',
            jobTitle: user.jobTitle || '',
            profileImage: user.profileImage || null,
            organizationName: user.organizationName || '',
            organizationType: user.organizationType || 'corporate',
            organizationSize: user.organizationSize || 'medium',
            department: user.department || '',
            primaryNetworkType: user.primaryNetworkType || 'wired',
            networkScale: user.networkScale || 'medium',
            ipRanges: user.ipRanges || '',
        };

        return res.status(200).json(profileData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// post profile data ----->
app.put('/api/profile', upload.single('profileImage'), async (req, res) => {
    try {
        const { email } = req.body; // Getting email from the form data
        
        const updateData = { ...req.body };

        // Map frontend "fullName" back to "user_name" in your DB
        if (updateData.fullName) {
            updateData.user_name = updateData.fullName;
        }

        // If a file was uploaded, store the URL
        if (req.file) {
            updateData.profileImage = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        }

        const updatedUser = await user_model.findOneAndUpdate(
            { user_email: email },
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ message: 'Profile updated successfully', updatedUser });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});


app.post('/local_scan/:email', async (req, res) => {
    const userEmail = req.params.email;
    const { deviceArray } = req.body; 

    try {
        const scanEntry = new local_scan_model({
            user_email: userEmail,
            devices: deviceArray,
            deviceCount: deviceArray ? deviceArray.length : 0
        });

        await scanEntry.save();
        console.log("local scan saved to database...");
        
        // Always send a response back to the client!
        return res.status(200).json({ message: "Scan saved successfully", scanEntry });
    } catch (error) {
        console.log("failed to save in the database...", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// retrieving local scan
app.get('/api/history/local/:email', async (req, res) => {
    const { email } = req.params;
    try {

        const history = await local_scan_model.find({ user_email: email }).sort({ createdAt: -1 });
        return res.status(200).json(history);
    } catch (error) {
        console.log("failed to fetch... ", error.message);
        return res.status(500).json({ message: "Server error while fetching history" });
    }
});

app.get('/api/history/ethernet/:email',async(req,res)=>{
    const { email } = req.params;
    try {
        const history = await local_scan_model.find({ user_email: email }).sort({ createdAt: -1 });
        return res.status(200).json(history);
    } catch (error) {
        console.log("failed to fetch... ", error.message);
        return res.status(500).json({ message: "Server error while fetching history" });
    }
})

app.listen(PORT,()=>{
    console.log(`backend is listening at :: http://localhost:${PORT}`);
})