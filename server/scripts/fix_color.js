const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const CVDocument = require("../models/CVDocument");

const fixColor = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const targetId = "697d45ac56a66445c005ac2a"; // Mymoon-CV-2026

    const cv = await CVDocument.findById(targetId);
    if (!cv) { console.log("CV not found"); process.exit(1); }

    // Fix Color to Blue (Creative default)
    if (cv.settings) {
        cv.settings.themeColor = '#2563eb';
    } else {
        cv.settings = { themeColor: '#2563eb' };
    }

    await cv.save();
    console.log(`Updated color to Blue (#2563eb) for CV: ${cv.title}`);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixColor();
