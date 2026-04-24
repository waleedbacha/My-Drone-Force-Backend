const mongoose = require("mongoose");

const onboardingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ========== PHASE 1: PRE-ENROLLMENT (Before Class Starts) ==========
    phase1: {
      cohortStartDate: { type: Date },
      applicationReceived: { type: Boolean, default: false },
      applicationReceivedDate: { type: Date },
      screeningCompleted: { type: Boolean, default: false },
      screeningCompletedDate: { type: Date },
      pledgeSigned: { type: Boolean, default: false },
      pledgeSignedDate: { type: Date },
      orientationCallScheduled: { type: Boolean, default: false },
      orientationCallDate: { type: Date },
      orientationCompleted: { type: Boolean, default: false },
      orientationCompletedDate: { type: Date },
    },

    // ========== PHASE 2: WEEK 0 (Pre-Class Setup) ==========
    phase2: {
      studyMaterialsProvided: { type: Boolean, default: false },
      studyMaterialsDate: { type: Date },
      loginInstructionsSent: { type: Boolean, default: false },
      loginInstructionsDate: { type: Date },
      classScheduleShared: { type: Boolean, default: false },
      classScheduleDate: { type: Date },
      examOverviewProvided: { type: Boolean, default: false },
      examOverviewDate: { type: Date },
      studyGuidanceProvided: { type: Boolean, default: false },
      studyGuidanceDate: { type: Date },
      day1PreWorkAssigned: { type: Boolean, default: false },
      day1PreWorkDate: { type: Date },
    },

    // ========== PHASE 3: TRAINING PERIOD (3-Day Core Program) ==========
    phase3: {
      day1Completed: { type: Boolean, default: false },
      day1Date: { type: Date },
      day2Completed: { type: Boolean, default: false },
      day2Date: { type: Date },
      day3Completed: { type: Boolean, default: false },
      day3Date: { type: Date },
      engagementVerified: { type: Boolean, default: false },
      engagementDate: { type: Date },
    },

    // ========== PHASE 4: POST-TRAINING (14–30 Day Success Window) ==========
    phase4: {
      // Week 1
      dailyStudyConfirmed: { type: Boolean, default: false },
      dailyStudyDate: { type: Date },
      practiceExam1Completed: { type: Boolean, default: false },
      practiceExam1Date: { type: Date },
      practiceExam1Score: { type: Number, default: 0 },
      groupStudyAttended: { type: Boolean, default: false },
      groupStudyDate: { type: Date },

      // Week 2
      practiceExam2Completed: { type: Boolean, default: false },
      practiceExam2Date: { type: Date },
      practiceExam2Score: { type: Number, default: 0 },
      weakAreasIdentified: { type: Boolean, default: false },
      weakAreasDate: { type: Date },
      targetedReviewCompleted: { type: Boolean, default: false },
      targetedReviewDate: { type: Date },

      // Week 3
      practiceExam3Completed: { type: Boolean, default: false },
      practiceExam3Date: { type: Date },
      practiceExam3Score: { type: Number, default: 0 },
      requiredScoreAchieved: { type: Boolean, default: false },
      requiredScoreDate: { type: Date },
      examReadinessAttended: { type: Boolean, default: false },
      examReadinessDate: { type: Date },
      lastMinuteCramAttended: { type: Boolean, default: false },
      lastMinuteCramDate: { type: Date },

      // Exam Readiness Rule
      practiceScore80Percent: { type: Boolean, default: false },
      practiceScoreDate: { type: Date },
      participantConfident: { type: Boolean, default: false },
      confidentDate: { type: Date },
      examScheduledWithinDeadline: { type: Boolean, default: false },
      examScheduledDate: { type: Date },
      examDate: { type: Date },
    },

    // ========== ACCOUNTABILITY SYSTEM (Weekly Check-ins) ==========
    accountability: {
      week1Checkin: {
        completed: { type: Boolean, default: false },
        date: { type: Date },
        response: { type: String, default: "" },
      },
      week2Checkin: {
        completed: { type: Boolean, default: false },
        date: { type: Date },
        response: { type: String, default: "" },
      },
      week3Checkin: {
        completed: { type: Boolean, default: false },
        date: { type: Date },
        response: { type: String, default: "" },
      },
      finalCheckin: {
        completed: { type: Boolean, default: false },
        date: { type: Date },
        response: { type: String, default: "" },
      },
    },

    // ========== FINAL OUTCOME ==========
    finalOutcome: {
      faaExamDate: { type: Date },
      faaExamResult: {
        type: String,
        enum: ["PASSED", "FAILED", "PENDING"],
        default: "PENDING",
      },
      finalScore: { type: Number, default: 0 },
      evaluatorName: { type: String, default: "" },
      evaluatorSignature: { type: String, default: "" },
      evaluatorDate: { type: Date },
    },

    // ========== PROGRAM COMPLETION ==========
    programCompleted: { type: Boolean, default: false },
    programCompletedAt: { type: Date },
    graduationDate: { type: Date },

    // Audit
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Calculate overall progress percentage
onboardingProgressSchema.methods.getProgressPercentage = function () {
  let totalTasks = 0;
  let completedTasks = 0;

  // Phase 1 (5 tasks - excluding cohortStartDate as it's not a checkbox)
  const phase1Tasks = [
    this.phase1.applicationReceived,
    this.phase1.screeningCompleted,
    this.phase1.pledgeSigned,
    this.phase1.orientationCallScheduled,
    this.phase1.orientationCompleted,
  ];
  totalTasks += phase1Tasks.length;
  completedTasks += phase1Tasks.filter(Boolean).length;

  // Phase 2 (6 tasks)
  const phase2Tasks = [
    this.phase2.studyMaterialsProvided,
    this.phase2.loginInstructionsSent,
    this.phase2.classScheduleShared,
    this.phase2.examOverviewProvided,
    this.phase2.studyGuidanceProvided,
    this.phase2.day1PreWorkAssigned,
  ];
  totalTasks += phase2Tasks.length;
  completedTasks += phase2Tasks.filter(Boolean).length;

  // Phase 3 (4 tasks)
  const phase3Tasks = [
    this.phase3.day1Completed,
    this.phase3.day2Completed,
    this.phase3.day3Completed,
    this.phase3.engagementVerified,
  ];
  totalTasks += phase3Tasks.length;
  completedTasks += phase3Tasks.filter(Boolean).length;

  // Phase 4 (12 tasks - practice exam scores count as completed if the checkbox is checked)
  const phase4Tasks = [
    this.phase4.dailyStudyConfirmed,
    this.phase4.practiceExam1Completed,
    this.phase4.groupStudyAttended,
    this.phase4.practiceExam2Completed,
    this.phase4.weakAreasIdentified,
    this.phase4.targetedReviewCompleted,
    this.phase4.practiceExam3Completed,
    this.phase4.requiredScoreAchieved,
    this.phase4.examReadinessAttended,
    this.phase4.lastMinuteCramAttended,
    this.phase4.practiceScore80Percent,
    this.phase4.participantConfident,
  ];
  totalTasks += phase4Tasks.length;
  completedTasks += phase4Tasks.filter(Boolean).length;

  // Accountability (4 check-ins)
  const accountabilityTasks = [
    this.accountability.week1Checkin?.completed || false,
    this.accountability.week2Checkin?.completed || false,
    this.accountability.week3Checkin?.completed || false,
    this.accountability.finalCheckin?.completed || false,
  ];
  totalTasks += accountabilityTasks.length;
  completedTasks += accountabilityTasks.filter(Boolean).length;

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

module.exports = mongoose.model("OnboardingProgress", onboardingProgressSchema);
