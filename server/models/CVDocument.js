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
        jobTitle: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        website: String,
        summary: String,
        photo: String, // Base64 or URL
        city: String,
        country: String,
        address: String,
        zipCode: String,
        idNumber: String,
        birthDate: Date,
        nationality: String,
        driversLicense: String
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
        location: String,
        startDate: Date,
        endDate: Date,
        current: { type: Boolean, default: false },
        description: String,
      }],
      skills: [String],
      languages: [{
        name: String,
        level: String,
      }],
      projects: [{
        name: String,
        description: String,
        link: String,
      }],
      hobbies: [{
        name: String,
      }],
      volunteering: [{
        role: String,
        organization: String,
        description: String,
      }],
      courses: [{
        name: String,
        institution: String,
      }],
      military: [{
        role: String,
        organization: String,
      }],
      references: [{
        name: String,
        contact: String,
      }],
      links: [{
        name: String,
        url: String,
      }],
      gdpr: [{
        text: String,
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
