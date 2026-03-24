const express = require('express')
const app  = express();
const connectDB = require('./Connection')
const user_model = require('./models/UserModel');
const local_scan_model = require('./models/LocalScanModel');
const ethernet_scan_model = require('./models/EthernetScanModel');
const Notes_model = require('./models/NotesModel');
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
        const user = await user_model.findOne({user_email:email});
        const history = await ethernet_scan_model.find({ userId: user.id }).sort({ createdAt: -1 });
        console.log(history)
        return res.status(200).json(history);
    } catch (error) {
        console.log("failed to fetch... ", error.message);
        return res.status(500).json({ message: "Server error while fetching history" });
    }
})

// --- DUMMY DATA FOR ETHERNET CONFIGS ---
// --- Backend: index.js / Ethernet Controller ---

let dummyConfigs = [
    {
      _id: "cfg_999",
      orgName: "HQ - Core Infrastructure",
      targetIps: "10.0.0.1, 10.0.0.254, 192.168.1.1", // Multiple seed IPs
      snmpVersion: "v3",
      username: "snmp_admin",
      isRecursive: true,
      resolveHostnames: true,
      useLLDP: true,
      useCDP: true,
      user_email: "test@gmail.com"
    },
    {
      _id: "cfg_777",
      orgName: "Branch Office - NY",
      targetIps: "172.16.50.1", // Single seed IP
      snmpVersion: "v2c",
      community: "readonly_public",
      isRecursive: false,
      resolveHostnames: true,
      useLLDP: true,
      useCDP: false,
      user_email: "test@gmail.com"
    }
  ];
  
  // ... REST OF THE GET/POST/PUT ROUTES ...
  // GET: Fetch dummy configurations
  app.get('/api/ethernet/configs/:email', (req, res) => {
      // We return the dummy data regardless of the email for now
      // In the real version, you'd do: await Model.find({ user_email: req.params.email })
      return res.status(200).json(dummyConfigs);
  });
  
  // POST: Create a new dummy configuration
  app.post('/api/ethernet/configs', (req, res) => {
      const newConfig = { ...req.body, _id: Date.now().toString() };
      dummyConfigs.push(newConfig);
      return res.status(201).json(newConfig);
  });
  
  // PUT: Update a dummy configuration
  app.put('/api/ethernet/configs/:id', (req, res) => {
      const { id } = req.params;
      dummyConfigs = dummyConfigs.map(c => c._id === id ? { ...req.body, _id: id } : c);
      return res.status(200).json({ message: "Updated successfully" });
  });


  // Make sure to import your model at the top of your file
// const Notes_model = require('./models/Notes'); 

app.post('/api/notes', async (req, res) => {
    try {
      // 1. Extract data from the incoming request body
      const { userEmail, title, content } = req.body;
      
      // 2. Initial Validation: Check if the frontend sent the required fields
      if (!userEmail || !title || !content) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide userEmail, title, and content.' 
        });
      }
  
      // 3. Find the user in the database
      const user = await user_model.findOne({ user_email: userEmail });
      
      // 4. CRITICAL CHECK: Did we actually find a user?
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User with that email not found.'
        });
      }
  
      // 5. Extract the MongoDB ObjectId securely
      const userId = user._id; 
  
      // 6. Create a new Note document
      const newNote = new Notes_model({
        userId, 
        title,
        content 
      });
  
      // 7. Save the document to the database
      const savedNote = await newNote.save();
  
      // 8. Send a success response
      res.status(201).json({
        success: true,
        message: 'Note saved successfully!',
        note: savedNote
      });
  
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).json({ 
        success: false, 
        message: 'An error occurred while saving the note.',
        error: error.message 
      });
    }
  });



  //ethernet scan save //
  app.post('/api/ethernet-scans', async (req, res) => {
    try {
      const { userEmail, directed, multigraph, graph, nodes, edges } = req.body;
  
      // 1. Basic validation
      if (!userEmail || !nodes || !edges) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields (userEmail, nodes, or edges).' 
        });
      }
  
      // 2. Fetch User ObjectId securely
      const user = await user_model.findOne({ user_email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found in the system.'
        });
      }
  
      // 3. Construct Document
      const newScan = new ethernet_scan_model({
        userId: user._id, 
        directed: directed || false,
        multigraph: multigraph || false,
        graph: graph || { real_loops: [] },
        nodes: nodes,
        edges: edges
      });
  
      // 4. Save to Database
      await newScan.save();
  
      res.status(201).json({
        success: true,
        message: 'Topology saved successfully!'
      });
  
    } catch (error) {
      console.error('Error saving topology:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while saving topology.',
        error: error.message 
      });
    }
  });


  // fetch notes
  // GET all notes for a specific user
app.get('/api/notes/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    // 1. Find the user by email to get their ObjectId
    const user = await user_model.findOne({ user_email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const notes = await Notes_model.find({ userId: user._id }).sort({ lastUpdated: -1 }); // Newest first

  
    res.status(200).json({
      success: true,
      notes: notes
    });

  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching notes.',
      error: error.message 
    });
  }
});

// DELETE a specific note by its ID
app.delete('/api/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;

    // findByIdAndDelete is a built-in Mongoose method
    const deletedNote = await Notes_model.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or already deleted.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully.'
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while deleting the note.',
      error: error.message 
    });
  }
});


app.listen(PORT,()=>{
    console.log(`backend is listening at :: http://localhost:${PORT}`);
})