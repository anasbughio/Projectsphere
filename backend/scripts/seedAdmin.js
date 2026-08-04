// backend/scripts/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User'); 
const Organization = require('../models/Organization'); 

const seedSuperAdmin = async () => {
  try {
    // 1. Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // 2. Check if a System Organization exists, if not, create it
    let systemOrg = await Organization.findOne({ name: 'System Administration' });
    
    if (!systemOrg) {
      systemOrg = await Organization.create({
        name: 'System Administration',
        domain: 'projectsphere.internal',
        subscriptionPlan: 'free',
        status: 'Active'
      });
      console.log('System Organization created.');
    }

    // 3. Check if Super Admin already exists
    const adminExists = await User.findOne({ role: 'Super Admin' });
    
    if (adminExists) {
      console.log('Super Admin already exists. Seeding skipped.');
      process.exit(0);
    }

    // 4. Create the Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@projectsphere.com',
      // Your userSchema.pre('save') hook will automatically hash this password
      password: process.env.SUPER_ADMIN_PASSWORD || 'DefaultAdmin123!', 
      role: 'Super Admin',
      organizationId: systemOrg._id,
      isEmailVerified: true 
    });

    console.log(`✅ Super Admin successfully created with email: ${superAdmin.email}`);
    process.exit(0); // Exit process successfully

  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    process.exit(1); // Exit process with failure
  }
};

seedSuperAdmin();