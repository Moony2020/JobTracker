const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
  console.log('Please provide an email: node set_admin.js user@example.com');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`Success! ${user.email} is now an admin.`);
    } else {
      console.log(`User with email ${email} not found.`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
