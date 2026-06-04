const express = require("express");
const FormSubmission = require("../models/FormSubmission");
const { authenticateRequest, requireRole } = require("../middleware/auth");

const router = express.Router();

const requiredFields = [
  "brideName",
  "bridePhone",
  "weddingDate",
  "customerSignature",
];

router.post("/", async (req, res, next) => {
  try {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body?.[field];
      return typeof value !== "string" || value.trim().length === 0;
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Please complete the required fields before submitting.",
        missingFields,
      });
    }

    const createdSubmission = await FormSubmission.create({
      ...req.body,
      submittedBy: null,
    });

    return res.status(201).json({
      message: "Form submitted successfully.",
      data: createdSubmission,
    });
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/",
  authenticateRequest,
  requireRole("admin"),
  async (_req, res, next) => {
    try {
      const submissions = await FormSubmission.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("submittedBy", "name email role");

      return res.json({
        data: submissions,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
