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
      // required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Default queries mein password return nahi hoga
    },
role: {
  type: String,
  enum: ['Admin', 'Member', 'Developer', 'Designer'], // Yeh naye roles add kar diye hain
  default: 'Member',
},
    // Yeh field Multi-Tenancy ka core hai
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      // required: true,
    },
  },
  { timestamps: true }
);

// Password encrypt karne ke liye pre-save middleware
userSchema.pre('save', async function () {
  // Agar password modify nahi hua toh yahin se wapas mud jao
  if (!this.isModified('password')) {
    return;
  }
  
  // Naya password hash karo
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
// User ka password verify karne ka method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);