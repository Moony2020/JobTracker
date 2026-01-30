const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Free", "Pro"],
      default: "Free",
    },
    price: {
      type: Number,
      default: 0, // 0 for Basic, or specific amount like 1.50
    },
    thumbnail: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Template", TemplateSchema);
