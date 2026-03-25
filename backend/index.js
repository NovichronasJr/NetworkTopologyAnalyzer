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
const nodemailer = require('nodemailer');
require('dotenv').config()

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
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit:'50mb',extended:true}))
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


// report mailing //

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465 (strict SSL)
  auth: {
    user: "emperorthunder80@gmail.com",
    pass:  process.env.NODEMAILER_AUTH_PASS// <-- Replace with your exact 16-letter App Password (NO SPACES!)
  },
});

// 3. VERIFY CONNECTION ON STARTUP (From Docs)
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Transporter Verification Failed (Check App Password!):", error.message);
  } else {
    console.log("✅ Nodemailer Server is ready to take our messages");
  }
});

// 4. THE EMAIL ROUTE
app.post('/api/send-report', async (req, res) => {
    const { pdfBase64, email } = req.body;

    if (!pdfBase64 || !email) {
        return res.status(400).json({ success: false, message: "Missing email or PDF data" });
    }

    try {
        // Strip the data URI prefix
        const base64Data = pdfBase64.split("base64,")[1];

        // --- PROFESSIONAL HTML EMAIL TEMPLATE ---
        const htmlContent = `
            <div style="font-family: 'Courier New', Courier, monospace; color: #e5e7eb; max-width: 600px; margin: 0 auto; background-color: #06121f; border: 1px solid #19d5ff33; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #19d5ff; font-style: italic; text-transform: uppercase; margin-bottom: 5px; font-size: 24px; letter-spacing: 2px;">Command Center NOC</h2>
                    <p style="color: #9ca3af; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 3px; margin-top: 0;">Automated Intelligence Dispatch</p>
                </div>

                <hr style="border: 0; border-top: 1px solid #19d5ff22; margin: 20px 0;">
                
                <p style="font-size: 14px; line-height: 1.6;">Attention Analyst,</p>
                <p style="font-size: 14px; line-height: 1.6;">The requested <strong>Ethernet Infrastructure & Topology Baseline Report</strong> has been successfully compiled and is securely attached to this transmission.</p>
                
                <div style="background-color: #0a1628; border-left: 3px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Dispatch Status</p>
                    <p style="margin: 5px 0 0 0; color: #10b981; font-weight: bold; font-size: 16px;">ENCRYPTED & SYNCED</p>
                </div>

                <hr style="border: 0; border-top: 1px solid #19d5ff22; margin: 20px 0;">
                
                <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px;">
                    This is an automated payload from the EtherScan Network Module.<br>Do not reply directly to this address.
                </p>
            </div>
        `;

        // 5. SEND MESSAGE (From Docs)
        const info = await transporter.sendMail({
            from: '"NOC Automated Dispatch" <emperorthunder80@gmail.com>', // Sender address
            to: email, // List of recipients
            subject: 'CLASSIFIED: NOC Ethernet Infrastructure Report', // Subject line
            text: 'Please find your requested Ethernet Infrastructure and Topology Report attached.', // Plain text fallback
            html: htmlContent, // HTML body
            attachments: [
                {
                    filename: `NOC_Baseline_Report_${new Date().toISOString().slice(0,10)}.pdf`,
                    content: base64Data,
                    encoding: 'base64'
                }
            ]
        });

        console.log("✅ Message sent successfully! ID: %s", info.messageId);
        return res.status(200).json({ success: true, message: "Report sent successfully" });

    } catch (err) {
        // 6. ERROR HANDLING (From Docs)
        console.error("❌ Send failed:", err.message);
        
        if (err.code === 'EAUTH') {
            return res.status(500).json({ success: false, message: "Backend Authentication Failed (Check App Password)" });
        }
        
        return res.status(500).json({ success: false, message: err.message });
    }
});
app.listen(PORT,()=>{
    console.log(`backend is listening at :: http://localhost:${PORT}`);
})