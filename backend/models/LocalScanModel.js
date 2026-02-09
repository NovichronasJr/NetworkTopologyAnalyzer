const mongoose = require("mongoose");

const LocalScanSchema = new mongoose.Schema({

  user_email: { 
    type: String, 
    required: true, 
    index: true 
  },


  devices: [
    {
      name: { type: String, default: "Unknown" },
      ip: { type: String, required: true },
      mac: { type: String, default: "--" }
    }
  ],

  deviceCount: { 
    type: Number, 
    default: 0 
  },
  
  scanDate: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });


module.exports = mongoose.model("LocalScan", LocalScanSchema);