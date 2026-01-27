const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(async () => {
    const result = await User.updateMany({}, { role: 'admin' });
    console.log(`Updated ${result.modifiedCount} users to admin.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
