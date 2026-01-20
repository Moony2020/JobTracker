const express = require("express");
const { body, validationResult } = require("express-validator");
const Application = require("../models/Application");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Get all applications for user
router.get("/", auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user.id };

    if (status && status !== "all") {
      query.status = status;
    }

    const applications = await Application.find(query).sort({ date: -1 });
    res.json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      message: "Server error fetching applications",
    });
  }
});

// Create new application
router.post(
  "/",
  [
    auth,
    body("jobTitle").trim().notEmpty().withMessage("Job title is required"),
    body("company").trim().notEmpty().withMessage("Company name is required"),
    body("date").isDate().withMessage("Valid date is required"),
    body("status")
      .isIn(["applied", "interview", "test", "offer", "rejected", "canceled"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { jobTitle, company, location, date, status, notes, jobLink, expectedSalary, offeredSalary, recruiterName, recruiterEmail, recruiterLinkedIn } = req.body;

      console.log("Received application data:", {
        // Debug log
        jobTitle,
        company,
        location,
        date,
        status,
        notes,
      });

      const application = new Application({
        user: req.user.id,
        jobTitle,
        company,
        location, // This should save the location
        date,
        status,
        notes,
        jobLink,
        expectedSalary,
        offeredSalary,
        recruiterName,
        recruiterEmail,
        recruiterLinkedIn,
        statusHistory: [{ status, date: new Date() }]
      });

      console.log("Application to be saved:", application); // Debug log

      await application.save();

      console.log("Application saved successfully:", application); // Debug log

      res.status(201).json(application);
    } catch (error) {
      console.error("Create application error:", error);
      res.status(500).json({
        message: "Server error creating application",
      });
    }
  }
);

// Update application
router.put(
  "/:id",
  [
    auth,
    body("jobTitle").trim().notEmpty().withMessage("Job title is required"),
    body("company").trim().notEmpty().withMessage("Company name is required"),
    body("date").isDate().withMessage("Valid date is required"),
    body("status")
      .isIn(["applied", "interview", "test", "offer", "rejected", "canceled"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { jobTitle, company, location, date, status, notes, jobLink, expectedSalary, offeredSalary, recruiterName, recruiterEmail, recruiterLinkedIn } = req.body;

      // First, get the current application to check status change
      const currentApp = await Application.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!currentApp) {
        return res.status(404).json({
          message: "Application not found or you are not authorized to update it",
        });
      }

      const statusChanged = currentApp.status !== status;

      // Update fields
      const application = await Application.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
        },
        {
          $set: {
            jobTitle,
            company,
            location,
            date,
            status,
            notes,
            jobLink,
            expectedSalary,
            offeredSalary,
            recruiterName,
            recruiterEmail,
            recruiterLinkedIn,
          },
          ...(statusChanged && {
            $push: { statusHistory: { status, date: new Date() } }
          })
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found or you are not authorized to update it",
        });
      }

      res.json(application);
    } catch (error) {
      console.error("Update application error:", error);
      if (error.name === "CastError") {
        return res.status(400).json({
          message: "Invalid application ID",
        });
      }
      res.status(500).json({
        message: "Server error updating application",
      });
    }
  }
);

// Delete application
router.delete("/:id", auth, async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found or you are not authorized to delete it",
      });
    }

    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }
    res.status(500).json({
      message: "Server error deleting application",
    });
  }
});

// New Endpoint: Upload Document
router.post("/:id/documents", [auth, upload.single("document")], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const document = {
      name: req.body.name || req.file.originalname,
      path: req.file.filename,
    };

    application.documents.push(document);
    await application.save();

    res.json(application);
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ message: "Failed to upload document" });
  }
});

// New Endpoint: Delete Document
router.delete("/:id/documents/:docId", auth, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.documents = application.documents.filter(
      (doc) => doc._id.toString() !== req.params.docId
    );
    
    await application.save();
    res.json(application);
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
});

module.exports = router;
