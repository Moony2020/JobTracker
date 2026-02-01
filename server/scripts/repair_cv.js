const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const CVDocument = require("../models/CVDocument");

const repair = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const targetId = "697d45ac56a66445c005ac2a"; // Mymoon-CV-2026
    const creativeTemplateId = "697eaa9fee809d6b6d06cf2b"; // Creative Executive

    const cv = await CVDocument.findById(targetId);
    if (!cv) {
        console.log("CV not found!");
        process.exit(1);
    }

    console.log(`Found CV: ${cv.title}`);
    console.log(`Current Template: ${cv.templateId}`);
    
    // Check Photo Size
    if (cv.data.personal.photo) {
        console.log(`Photo Size: ${cv.data.personal.photo.length} chars`);
        if (cv.data.personal.photo.length > 5000000) {
            console.warn("WARNING: Photo is extremely large (>5MB). This might cause load failures.");
        }
    }

    // Update Template
    cv.templateId = creativeTemplateId;
    // cv.templateKey is NOT a field, it's derived.
    
    // Ensure birthDate is valid or null
    if (cv.data.personal.birthDate && typeof cv.data.personal.birthDate !== 'object') {
         // If it's a string that complicates things, but schema is Date.
         // Script showed 'null' (object) which is fine.
    }

    await cv.save();
    console.log("SUCCESS: Updated CV to use 'Creative' template.");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

repair();
