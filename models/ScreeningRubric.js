const mongoose = require("mongoose");

const screeningRubricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
    },
    screeningDate: {
      type: Date,
      default: Date.now,
    },

    // Section 1: Basic Eligibility (Required - All must be 'Yes')
    ageRequirement: { type: Boolean, required: true },
    validId: { type: Boolean, required: true },
    englishReadWrite: { type: Boolean, required: true },

    // Section 2: Technical Readiness
    hasComputerTablet: { type: Boolean, required: true },
    hasInternet: { type: Boolean, required: true },
    comfortableZoom: { type: Boolean, required: true },

    // Section 3: Availability & Commitment
    availableTraining: { type: Boolean, required: true },
    canAttendInPerson: { type: Boolean, required: true },
    canStudyDaily: { type: Boolean, required: true },
    canTakeExamWithin30Days: { type: Boolean, required: true },

    // Section 4: Motivation Indicators (2x weight)
    clearReasonForCert: { type: Boolean, required: true },
    careerInterest: { type: Boolean, required: true },
    willingSignPledge: { type: Boolean, required: true },

    // Scoring Results
    section1Score: { type: Number, default: 0 },
    section2Score: { type: Number, default: 0 },
    section3Score: { type: Number, default: 0 },
    section4Score: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    eligibilityStatus: {
      type: String,
      enum: ["eligible", "conditional", "not_eligible"],
      required: true,
    },
    eligibilityMessage: { type: String },

    // Notes
    notes: { type: String },

    // Audit
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ScreeningRubric", screeningRubricSchema);
