import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('✓ Admin already exists:', process.env.ADMIN_EMAIL);
      await mongoose.connection.close();
      return;
    }

    // Create new admin
    const admin = new Admin({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });

    await admin.save();
    console.log('✓ Admin account created successfully!');
    console.log('  Email:', process.env.ADMIN_EMAIL);
    console.log('  Password:', process.env.ADMIN_PASSWORD);
    console.log('\n✓ You can now login with these credentials');

    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
