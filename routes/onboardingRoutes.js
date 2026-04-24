const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  getOnboardingProgress,
  updatePhase1,
  updatePhase2,
  updatePhase3,
  updatePhase4,
  updateAccountability,
  updateFinalOutcome,
  completeProgram,
} = require("../controllers/onboardingController");

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Get onboarding progress
router.get("/:userId", getOnboardingProgress);

// Update phases
router.put("/:userId/phase1", updatePhase1);
router.put("/:userId/phase2", updatePhase2);
router.put("/:userId/phase3", updatePhase3);
router.put("/:userId/phase4", updatePhase4);

// Update accountability
router.put("/:userId/accountability", updateAccountability);

// Update final outcome
router.put("/:userId/final-outcome", updateFinalOutcome);

// Complete program
router.post("/:userId/complete", completeProgram);

module.exports = router;
