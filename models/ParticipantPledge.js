const mongoose = require("mongoose");

const participantPledgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participantName: {
      type: String,
      required: true,
    },
    cohortMonth: {
      type: String,
      required: true,
    },

    // 1. Attendance Commitment
    attendVirtualSessions: { type: Boolean, required: true },
    attendInPersonSessions: { type: Boolean, required: true },
    understandMissedImpact: { type: Boolean, required: true },

    // 2. Active Participation
    activelyEngage: { type: Boolean, required: true },
    participateDiscussions: { type: Boolean, required: true },
    askQuestions: { type: Boolean, required: true },

    // 3. Study Commitment
    completeStudyMaterials: { type: Boolean, required: true },
    dedicateDailyStudy: { type: Boolean, required: true },
    participateGroupStudy: { type: Boolean, required: true },

    // 4. Practice Exam Requirement
    completePracticeExams: { type: Boolean, required: true },
    reviewIncorrectAnswers: { type: Boolean, required: true },

    // 5. FAA Exam Commitment
    scheduleExamWithin30Days: { type: Boolean, required: true },
    understandDelayImpact: { type: Boolean, required: true },

    // 6. Accountability Acknowledgment
    understandSuccessLink: { type: Boolean, required: true },
    acknowledgeExpectations: { type: Boolean, required: true },

    // Signature
    participantSignature: {
      type: String,
      required: true,
    },
    signatureDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Audit
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ParticipantPledge", participantPledgeSchema);
