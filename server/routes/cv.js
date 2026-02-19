const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const CVDocument = require("../models/CVDocument");
const Template = require("../models/Template");
const Purchase = require("../models/Purchase");

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
    const purchases = await Purchase.find({ 
      user: req.user.id, 
    });

    // Map CVs with a helper 'isPaid' flag and 'isExpired' flag
    const cvsWithStatus = cvs.map(cv => {
      const isPaid = purchases.some(p => 
        p.cvDocument && p.cvDocument.toString() === cv._id.toString()
      );
      // Check if ALL matching purchases are expired
      // If isPaid is true, we check if there is at least one active purchase
      let isExpired = false;
      if (isPaid) {
          const hasActive = purchases.some(p => 
            p.cvDocument && p.cvDocument.toString() === cv._id.toString() &&
            (!p.expiresAt || new Date(p.expiresAt) > new Date()) &&
            p.status === "completed" // Only consider completed purchases for active status
          );
          isExpired = !hasActive;
      }

      return {
        ...cv.toObject(),
        isPaid,
        isExpired
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
// @access  Public
router.get("/templates", async (req, res) => {
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

    const purchases = await Purchase.find({
      user: req.user.id,
      status: "completed"
    });
    
    console.log(`[CV Check] Debug: User ${req.user.id} has ${purchases.length} completed purchases.`);
    if (purchases.length > 0) {
      console.log(`[CV Check] Purchase CV IDs:`, purchases.map(p => p.cvDocument?.toString()));
    }
    console.log(`[CV Check] Current CV ID: ${cv._id}`);

    const isPaid = purchases.some(p => {
        const match = p.cvDocument && p.cvDocument.toString() === cv._id.toString();
        const active = !p.expiresAt || new Date(p.expiresAt) > new Date();
        if (match && active) console.log(`[CV Check] Found active purchase for CV ${cv._id}`);
        return match && active;
    });

    if (!isPaid) {
        console.log(`[CV Check] No completed purchase for CV ${cv._id}. Purchases:`, purchases.map(p => p.cvDocument));
    }

    res.json({
      ...cv.toObject(),
      isPaid
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

    // PREMIUM ENFORCEMENT
    const template = await Template.findById(templateId || cv.templateId);
    if (template && template.category === "Pro") {
      const now = new Date();
      const isPremium = req.user.isPremium && req.user.premiumUntil && new Date(req.user.premiumUntil) > now;
      
      // If not premium, check if this specific CV was purchased
      if (!isPremium) {
        const purchases = await Purchase.find({
          user: req.user.id,
          status: "completed"
        });
        const isPaid = purchases.some(p => {
            const match = p.cvDocument && p.cvDocument.toString() === cv._id.toString();
            const active = !p.expiresAt || new Date(p.expiresAt) > new Date();
            if (match && active) console.log(`[CV Check:PUT] Found active purchase for CV ${cv._id}`);
            return match && active;
        });

        if (!isPaid) {
          console.log(`[CV Check:PUT] 403: No completed purchase for CV ${cv._id}. User: ${req.user.id}`);
          return res.status(403).json({ 
              msg: "Renew Premium for edit access to Pro templates",
              code: "PREMIUM_EXPIRED"
          });
        }
      }
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

    // Ensure template exists to avoid crash
    // If templateId is null/missing (e.g. broken reference), default to a safe value
    const templateCategory = cv.templateId?.category || "Free";
    
    // PREMIUM ENFORCEMENT
    if (templateCategory === "Pro") {
      const now = new Date();
      const isPremium = req.user.isPremium && req.user.premiumUntil && new Date(req.user.premiumUntil) > now;
      
      if (!isPremium) {
        // If not premium, check if this specific CV was purchased
        const purchases = await Purchase.find({
          user: req.user.id,
          status: "completed"
        });
        const isPaid = purchases.some(p => {
        const match = p.cvDocument && p.cvDocument.toString() === cv._id.toString();
        const active = !p.expiresAt || new Date(p.expiresAt) > new Date();
        if (match && active) console.log(`[CV Check:Export] Found active purchase for CV ${cv._id}`);
        return match && active;
    });

        if (!isPaid) {
          console.log(`[Export] 403: Premium expired for User: ${req.user.id}, CV: ${cv._id}`);
          return res.status(403).json({ 
              msg: "Access to this Pro template has expired. Please renew your premium.",
              code: "PREMIUM_EXPIRED"
          });
        }
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

// @route   POST api/cv/fix-template/:id
// @desc    Manually fix template to timeline and debug isPaid
// @access  Private
router.post("/fix-template/:id", auth, async (req, res) => {
  try {
    const cv = await CVDocument.findById(req.params.id);
    if (!cv) return res.status(404).json({ msg: "CV not found" });

    if (cv.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Force update to timeline (Premium)
    // Timeline ID usually: 660d5f2c73291244e8574163 (from standard seed) 
    // We will look it up or just set the key
    const timelineTemplate = await Template.findOne({ key: 'timeline' });
    if (timelineTemplate) {
        cv.templateId = timelineTemplate._id;
        cv.templateKey = 'timeline';
        await cv.save();
        console.log(`[Fix] Restored CV ${cv._id} to timeline template.`);
    } else {
        console.log(`[Fix] Timeline template not found in DB.`);
    }

    // DEBUG isPaid
    const purchases = await Purchase.find({
      user: req.user.id,
      status: "completed"
    });
    
    console.log(`[Fix Check] User ${req.user.id} has ${purchases.length} purchases.`);
    purchases.forEach(p => {
        console.log(` - Purchase: CV=${p.cvDocument}, Status=${p.status}`);
    });

    const isPaid = purchases.some(p => 
        p.cvDocument && p.cvDocument.toString() === cv._id.toString() &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );
    console.log(`[Fix Check] isPaid result for CV ${cv._id}: ${isPaid}`);

    res.json({ msg: "Template fixed", isPaid, cv });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
