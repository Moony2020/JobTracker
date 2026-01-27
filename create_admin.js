const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

const adminEmail = 'u3811698473@gmail.com';
const adminPassword = 'admin123'; // Temporary password

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      // 1. Revert mymoon676@hotmail.com to user
      await User.findOneAndUpdate(
        { email: 'mymoon676@hotmail.com' },
        { role: 'user' }
      );
      console.log('mymoon676@hotmail.com reverted to user.');

      // 2. Check if admin exists, if not create it
      let admin = await User.findOne({ email: adminEmail });
      
      if (!admin) {
        admin = new User({
          name: 'System Admin',
          email: adminEmail,
          password: adminPassword,
          role: 'admin'
        });
        await admin.save();
        console.log(`Created new Admin account: ${adminEmail} with password: ${adminPassword}`);
      } else {
        admin.role = 'admin';
        await admin.save();
        console.log(`${adminEmail} already exists, updated to admin.`);
      }

    } catch(e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
