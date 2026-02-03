// Quick test script to verify login works
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';

dotenv.config();

const testLogin = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Testing login credentials...\n');
    
    // Test email lookup
    const email = 'parent@demo.com';
    const password = 'password123';
    
    console.log(`Looking for user with email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log('💡 Run: npm run seed');
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.name} (${user.role})`);
    console.log(`📧 Email in DB: ${user.email}`);
    
    // Test password
    console.log(`\n🔐 Testing password...`);
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      console.log('✅ Password matches!');
      console.log('\n✅ Login should work!');
    } else {
      console.log('❌ Password does not match');
      console.log('💡 The password might have been changed or not hashed correctly');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testLogin();

