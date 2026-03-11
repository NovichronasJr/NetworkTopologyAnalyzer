const mongoose = require('mongoose');

const EthernetScanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  scannedAt: { 
    type: Date, 
    default: Date.now 
  },
  directed: { type: Boolean, default: false },
  multigraph: { type: Boolean, default: false },
  graph: {
    real_loops: [[String]] 
  },
  nodes: [{
    _id: false, 
    id: { type: String, required: true }, 
    status: { type: String, required: true },
    discovered_by: { type: String },
    role: { type: String },
    connection_type: { type: String },
    mac_address: { type: String }
  }],
  edges: [{
    _id: false, 
    source: { type: String, required: true },
    target: { type: String, required: true },
    relation: { type: String }
  }]
});

module.exports = mongoose.model('EthernetScan', EthernetScanSchema);