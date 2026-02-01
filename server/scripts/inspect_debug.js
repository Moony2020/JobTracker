const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const Template = require("../models/Template");
const CVDocument = require("../models/CVDocument");

const inspect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // 1. List Templates
    console.log("\n--- TEMPLATES ---");
    const templates = await Template.find({});
    templates.forEach(t => {
      console.log(`Key: ${t.key.padEnd(10)} | ID: ${t._id} | Name: ${t.name}`);
    });

    // 2. List CVs
    console.log("\n--- CV DOCUMENTS ---");
    const cvs = await CVDocument.find({}).populate('templateId');
    cvs.forEach(cv => {
      console.log(`\nTitle: ${cv.title}`);
      console.log(`ID: ${cv._id}`);
      console.log(`User ID: ${cv.user}`);
      console.log(`Template Ref: ${cv.templateId ? cv.templateId.key : 'NULL'} (${cv.templateId ? cv.templateId._id : 'null'})`);
      
      const p = cv.data?.personal || {};
      console.log(`Data Check: Name: '${p.firstName}', Email: '${p.email}'`);
      console.log(`BirthDate: ${p.birthDate} (Type: ${typeof p.birthDate})`);

      try {
          JSON.stringify(cv.toObject());
          console.log("Serialization: OK");
      } catch (e) {
          console.log("Serialization: FAILED", e.message);
      }
    });

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspect();
