const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const CVDocument = require("../models/CVDocument");
const Template = require("../models/Template");

// @route   GET api/cv
// @desc    Get all user's CVs
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const cvs = await CVDocument.find({ user: req.user.id })
      .populate("templateId")
      .sort({ updatedAt: -1 });
    res.json(cvs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/cv/templates
// @desc    Get all available templates
// @access  Private
router.get("/templates", auth, async (req, res) => {
  try {
    const templates = await Template.find({ isActive: true });
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/cv
// @desc    Create a new CV
// @access  Private
router.post("/", auth, async (req, res) => {
  const { title, templateId, relatedJob } = req.body;

  try {
    const newCV = new CVDocument({
      user: req.user.id,
      title,
      templateId,
      relatedJob,
      data: {
        personal: {},
        experience: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        customSections: []
      }
    });

    const cv = await newCV.save();
    res.json(cv);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/cv/:id
// @desc    Get CV by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const cv = await CVDocument.findById(req.params.id).populate("templateId");

    if (!cv) {
      return res.status(404).json({ msg: "CV not found" });
    }

    // Check if user owns the CV
    if (cv.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    res.json(cv);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "CV not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/cv/:id
// @desc    Update a CV
// @access  Private
router.put("/:id", auth, async (req, res) => {
  const { title, settings, data, templateId } = req.body;

  try {
    let cv = await CVDocument.findById(req.params.id);

    if (!cv) {
      return res.status(404).json({ msg: "CV not found" });
    }

    // Check if user owns the CV
    if (cv.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const updatedCV = {};
    if (title) updatedCV.title = title;
    if (settings) updatedCV.settings = settings;
    if (data) updatedCV.data = data;
    if (templateId) updatedCV.templateId = templateId;

    cv = await CVDocument.findByIdAndUpdate(
      req.params.id,
      { $set: updatedCV },
      { new: true }
    );

    res.json(cv);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/cv/:id
// @desc    Delete a CV
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const cv = await CVDocument.findById(req.params.id);

    if (!cv) {
      return res.status(404).json({ msg: "CV not found" });
    }

    // Check if user owns the CV
    if (cv.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await CVDocument.findByIdAndRemove(req.params.id);

    res.json({ msg: "CV removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const { generatePDF } = require("../services/pdfService");
const Purchase = require("../models/Purchase");

// @route   GET api/cv/export/:id
// @desc    Export CV as PDF
// @access  Private
router.get("/export/:id", auth, async (req, res) => {
  try {
    const cv = await CVDocument.findById(req.params.id).populate("templateId");

    if (!cv) {
      return res.status(404).json({ msg: "CV not found" });
    }

    // Check ownership
    if (cv.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // If template is premium, check if a completed purchase exists
    if (cv.templateId.category === "Premium") {
      const purchase = await Purchase.findOne({
        user: req.user.id,
        cvDocument: cv._id,
        template: cv.templateId._id,
        status: "completed"
      });

      if (!purchase) {
        return res.status(402).json({ msg: "Payment required for premium template" });
      }
    }

    const pdfBuffer = await generatePDF(cv._id, req.user.id, cv.templateId.key);

    res.contentType("application/pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error during export");
  }
});

module.exports = router;
