const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const users = await User.find({ email: { $in: ['u3811698473@gmail.com', 'mymoon676@hotmail.com'] } });
      for (let user of users) {
        user.password = 'admin123';
        user.role = 'admin';
        await user.save();
        console.log(`Updated ${user.email} password to 'admin123' and role to 'admin'`);
      }
    } catch(e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  });
