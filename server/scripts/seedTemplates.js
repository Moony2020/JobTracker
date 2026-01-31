const path = require("path");
const mongoose = require("mongoose");
const Template = require("../models/Template");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const templates = [
  {
    name: "Timeline",
    key: "timeline",
    category: "Free",
    price: 0,
    thumbnail: "/images/templates/timeline.png",
  },
  {
    name: "Classic Professional",
    key: "classic",
    category: "Free",
    price: 0,
    thumbnail: "/images/templates/classic.png",
  },
  {
    name: "Modern ATS-Friendly",
    key: "modern",
    category: "Free",
    price: 0,
    thumbnail: "/images/templates/modern.png",
  },
  {
    name: "Creative Executive",
    key: "creative",
    category: "Pro",
    price: 1.5,
    thumbnail: "/images/templates/creative.png",
  },
];

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Remove existing templates to avoid duplicates during dev
    await Template.deleteMany({});
    
    await Template.insertMany(templates);
    console.log("Templates seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedTemplates();
