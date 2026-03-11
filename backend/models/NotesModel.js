const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  // Added required: true to ensure every note is tied to a user
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notes', NoteSchema);