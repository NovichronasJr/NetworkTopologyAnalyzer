const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  // --- AUTHENTICATION (DO NOT CHANGE) ---
  user_name: {
    type: String,
    required: true,
  },
  user_email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },

  // --- NEW PROFILE FIELDS ---
  // We keep these optional (no 'required: true') so registration doesn't break
  phone: { type: String, default: "" },
  jobTitle: { type: String, default: "" },
  
  // Profile Image stored as a Base64 string or URL
  profileImage: { type: String, default: null },
  
  // Organization Information
  organizationName: { type: String, default: "" },
  organizationType: { 
    type: String, 
    enum: ['corporate', 'educational', 'government', 'healthcare', 'other'],
    default: 'corporate' 
  },
  organizationSize: { 
    type: String, 
    enum: ['small', 'medium', 'large', 'enterprise'],
    default: 'medium' 
  },
  department: { type: String, default: "" },
  
  primaryNetworkType: { 
    type: String, 
    enum: ['wired', 'wireless', 'hybrid'],
    default: 'wired' 
  },
  networkScale: { 
    type: String, 
    enum: ['small', 'medium', 'large', 'enterprise'],
    default: 'medium' 
  },
  ipRanges: { type: String, default: "" }, // Stored as a comma-separated string

}, { timestamps: true });

// --- EXISTING METHODS (DO NOT CHANGE) ---
UserSchema.pre("save", async function() {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);