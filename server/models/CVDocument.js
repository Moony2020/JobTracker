const mongoose = require("mongoose");

const CVDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "CV title is required"],
      trim: true,
      default: "Untitled Resume",
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    settings: {
      themeColor: { type: String, default: "#2563eb" },
      font: { type: String, default: "Inter" },
      fontSize: { type: String, default: "11pt" },
      lineHeight: { type: Number, default: 1.5 },
      margin: { type: Number, default: 20 },
    },
    data: {
      personal: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        website: String,
        summary: String,
        photo: String, // Base64 or URL
      },
      experience: [{
        title: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        current: { type: Boolean, default: false },
        description: String,
      }],
      education: [{
        school: String,
        degree: String,
        field: String,
        startDate: Date,
        endDate: Date,
        current: { type: Boolean, default: false },
        description: String,
      }],
      skills: [{
        name: String,
        level: String, // e.g., Beginner, Expert
      }],
      languages: [{
        name: String,
        level: String,
      }],
      projects: [{
        name: String,
        description: String,
        link: String,
      }],
      customSections: [{
        title: String,
        content: String,
      }]
    },
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastDownloaded: Date,
  },
  {
    timestamps: true,
  }
);

CVDocumentSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("CVDocument", CVDocumentSchema);
