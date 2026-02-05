const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Try loading .env from several locations
const envPaths = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(process.cwd(), '.env')
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const User = require('../models/User');
const Purchase = require('../models/Purchase');

async function backfill() {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Find all completed purchases
    const purchases = await Purchase.find({ status: 'completed' }).sort({ createdAt: -1 });
    console.log(`Found ${purchases.length} completed purchases.`);

    const userMap = new Map();

    for (const purchase of purchases) {
      const userId = purchase.user.toString();
      
      // If we already have a later expiry for this user, skip
      if (userMap.has(userId) && userMap.get(userId) > purchase.expiresAt) {
        continue;
      }

      if (purchase.expiresAt) {
        userMap.set(userId, purchase.expiresAt);
      }
    }

    console.log(`Updating ${userMap.size} users...`);

    for (const [userId, expiresAt] of userMap) {
      const now = new Date();
      // Only set isPremium if still valid, but we should probably set premiumUntil regardless if it's the latest
      const isStillPremium = expiresAt > now;
      
      await User.findByIdAndUpdate(userId, {
        $set: { 
          isPremium: isStillPremium, 
          premiumUntil: expiresAt 
        }
      });
      console.log(`Updated user ${userId}: isPremium=${isStillPremium}, until=${expiresAt}`);
    }

    console.log('Backfill complete.');
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
}

backfill();
