const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false, 
    },
    role: {
      type: String,
      // 1. UPDATED: Roles document ke mutabiq set kar diye gaye hain
      enum: ['Super Admin', 'Org Admin', 'Project Manager', 'Team Member', 'Client'], 
      default: 'Team Member',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      // 2. UPDATED: Isay required kar diya hai isolation ke liye
      required: true, 
    },
    refreshToken: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    resetPasswordOtp: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    profilePicture: {
  type: String,
  default: '' // Default empty rakhein, agar pic nahi hogi toh hum UI par user ke naam ke initials dikhayenge
},
isDeleted: {
  type: Boolean,
  default: false
}
  },
  { timestamps: true }
);

// 3. UPDATED: Document ke mutabiq Compound Index add kar diya gaya hai
userSchema.index({ organizationId: 1, _id: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);