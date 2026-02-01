const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const Template = require("../models/Template");

const cleanupTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // Find "Executive (Maria)"
    const executiveMaria = await Template.findOne({ name: "Executive (Maria)" });
    if (executiveMaria) {
      executiveMaria.name = "Executive";
      await executiveMaria.save();
      console.log("Renamed 'Executive (Maria)' to 'Executive'");
    } else {
      console.log("'Executive (Maria)' not found. Checking if already fixed...");
      const executive = await Template.findOne({ name: "Executive" });
      if (executive) {
          console.log("Found 'Executive'. It seems already fixed.");
      } else {
          console.log("Warning: Neither 'Executive (Maria)' nor 'Executive' found.");
      }
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

cleanupTemplates();
