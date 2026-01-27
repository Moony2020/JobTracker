const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const user = await User.findOneAndUpdate(
      { email: 'mymoon676@hotmail.com' },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`Success! ${user.email} is now an admin.`);
    } else {
      console.log(`User not found.`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
