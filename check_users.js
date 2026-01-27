const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./server/models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const users = await User.find({}, 'name email role');
      console.log('=== All Users in Database ===');
      users.forEach(u => {
        console.log(`Email: ${u.email} | Role: ${u.role} | Name: ${u.name || 'N/A'}`);
      });
    } catch(e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
