const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const CVDocument = require("../models/CVDocument");
const Template = require("../models/Template");

// @route   GET api/cv
// @desc    Get all user's CVs
// @access  Private
// @route   GET api/cv
// @desc    Get all user's CVs with purchase status
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const cvs = await CVDocument.find({ user: req.user.id })
      .populate("templateId")
      .sort({ updatedAt: -1 });
    
    // Get all completed purchases for this user
    const Purchase = require("../models/Purchase");
    const purchases = await Purchase.find({ 
      user: req.user.id, 
      status: "completed" 
    });

    // Map CVs with a helper 'isPaid' flag
    const cvsWithStatus = cvs.map(cv => {
      const isPaid = purchases.some(p => 
        p.cvDocument.toString() === cv._id.toString() && 
        p.template.toString() === cv.templateId?._id?.toString()
      );
      return {
        ...cv.toObject(),
        isPaid
      };
    });

    res.json(cvsWithStatus);
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

    // Check if CV is paid
    const Purchase = require("../models/Purchase");
    const purchase = await Purchase.findOne({
      user: req.user.id,
      cvDocument: cv._id,
      status: "completed"
    });

    res.json({
      ...cv.toObject(),
      isPaid: !!purchase
    });
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

    // If template is Pro or Premium, check if a completed and unexpired purchase exists
    if (cv.templateId.category === "Pro" || cv.templateId.category === "Premium") {
      // Find ANY completed purchase for this user and this CV document
      console.log(`[Export] Verifying purchase for User: ${req.user.id}, CV: ${cv._id}, Template: ${cv.templateId.key}`);
      
      const purchase = await Purchase.findOne({
        user: req.user.id,
        cvDocument: cv._id,
        status: "completed"
      }).sort({ createdAt: -1 });

      if (!purchase) {
        console.log(`[Export] 402: No purchase found matching User: ${req.user.id} and CV: ${cv._id}`);
        // Log all completed purchases for this user for debugging
        const allUserPurchases = await Purchase.find({ user: req.user.id, status: "completed" });
        console.log(`[Export] User ${req.user.id} has ${allUserPurchases.length} total completed purchases.`);
        allUserPurchases.forEach(p => console.log(` - Purchase ${p._id} for CV: ${p.cvDocument}`));
        
        return res.status(402).json({ msg: "Payment required for Pro template" });
      }

      // Check if access has expired (only for Pro, Premium is lifetime)
      if (purchase.expiresAt && new Date() > purchase.expiresAt) {
        return res.status(403).json({ msg: "Access to this Pro template download has expired (7-day window)" });
      }
    }
    // Ensure template exists to avoid crash
    const templateKey = cv.templateId?.key || "modern";

    const pdfBuffer = await generatePDF(cv._id, req.user.id, templateKey, req.token);

    res.contentType("application/pdf");
    res.end(pdfBuffer, 'binary');
  } catch (err) {
    console.error("Export Error:", err);
    // Explicitly reset content type for errors to avoid "corrupted PDF" browser errors
    res.status(500).setHeader('Content-Type', 'text/plain').send("Server Error during export: " + err.message);
  }
});

module.exports = router;
