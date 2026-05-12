const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ========== PERSONAL INFORMATION ==========
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    // ========== ADDRESS INFORMATION ==========
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, "ZIP code is required"],
      trim: true,
      match: [/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"],
    },

    // ========== COURSE INFORMATION ==========
    courseInterest: {
      type: String,
      required: [true, "Course interest is required"],
      enum: [
        "Part 107 Certification",
        "Hands-On Flight Training",
        "Career Placement Assistance",
        "Workforce Development",
        "Youth Program",
        "Corporate Training",
      ],
    },
    cohortMonth: {
      type: String,
      default: "",
    },
    hearAboutUs: {
      type: String,
      enum: ["Google", "Social Media", "Friend/Family", "Email", "Other"],
      default: "Other",
    },

    // ========== PROFILE IMAGE ==========
    profileImage: {
      type: String,
      default: "",
    },

    // ========== STATUS ==========
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    registeredBy: {
      type: String,
      enum: ["self", "admin"],
      default: "self",
    },

    // ========== STEP 1: ONBOARDING VERIFICATION CHECKLIST ==========
    englishProficiency: {
      type: Boolean,
      required: [true, "English proficiency confirmation is required"],
      default: false,
    },
    programCommitment: {
      type: Boolean,
      required: [true, "Program commitment confirmation is required"],
      default: false,
    },
    techAccess: {
      type: Boolean,
      required: [true, "Technology access confirmation is required"],
      default: false,
    },

    // ========== STEP 1: BASIC COMMITMENT AGREEMENTS ==========
    commitmentAgreements: {
      type: [String],
      default: [],
    },
    electronicSignature: {
      type: String,
      trim: true,
    },
    signatureDate: {
      type: Date,
    },
    printedName: {
      type: String,
      trim: true,
    },
    signatureIpAddress: {
      type: String,
      default: "",
    },
    signatureUserAgent: {
      type: String,
      default: "",
    },

    // ========== STEP 2: SCREENING RUBRIC RESULTS ==========
    screeningRubric: {
      // Section 1: Basic Eligibility
      ageRequirement: { type: Boolean, default: false },
      validId: { type: Boolean, default: false },
      englishReadWrite: { type: Boolean, default: false },

      // Section 2: Technical Readiness
      hasComputerTablet: { type: Boolean, default: false },
      hasInternet: { type: Boolean, default: false },
      comfortableZoom: { type: Boolean, default: false },

      // Section 3: Availability & Commitment
      availableTraining: { type: Boolean, default: false },
      canAttendInPerson: { type: Boolean, default: false },
      canStudyDaily: { type: Boolean, default: false },
      canTakeExamWithin30Days: { type: Boolean, default: false },

      // Section 4: Motivation Indicators
      clearReasonForCert: { type: Boolean, default: false },
      careerInterest: { type: Boolean, default: false },
      willingSignPledge: { type: Boolean, default: false },

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
        default: "not_eligible",
      },
      eligibilityMessage: { type: String, default: "" },

      // Evaluator Info (for admin review)
      evaluatorName: { type: String, default: "" },
      evaluatorDate: { type: Date },
      evaluatorComments: { type: String, default: "" },

      screeningCompleted: { type: Boolean, default: false },
      screeningCompletedAt: { type: Date },
    },

    // ========== STEP 3: PARTICIPANT COMMITMENT PLEDGE ==========
    participantPledge: {
      // 1. Attendance Commitment
      attendVirtualSessions: { type: Boolean, default: false },
      attendInPersonSessions: { type: Boolean, default: false },
      understandMissedImpact: { type: Boolean, default: false },

      // 2. Active Participation
      activelyEngage: { type: Boolean, default: false },
      participateDiscussions: { type: Boolean, default: false },
      askQuestions: { type: Boolean, default: false },

      // 3. Study Commitment
      completeStudyMaterials: { type: Boolean, default: false },
      dedicateDailyStudy: { type: Boolean, default: false },
      participateGroupStudy: { type: Boolean, default: false },

      // 4. Practice Exam Requirement
      completePracticeExams: { type: Boolean, default: false },
      reviewIncorrectAnswers: { type: Boolean, default: false },

      // 5. FAA Exam Commitment
      scheduleExamWithin30Days: { type: Boolean, default: false },
      understandDelayImpact: { type: Boolean, default: false },

      // 6. Accountability Acknowledgment
      understandSuccessLink: { type: Boolean, default: false },
      acknowledgeExpectations: { type: Boolean, default: false },

      // Signature
      participantSignature: { type: String, default: "" },
      pledgeSignedDate: { type: Date },
      pledgeSignedAt: { type: Date },
      pledgeIpAddress: { type: String, default: "" },
      pledgeUserAgent: { type: String, default: "" },
      pledgeCompleted: { type: Boolean, default: false },
    },

    // ========== REGISTRATION STATUS ==========
    registrationStatus: {
      type: String,
      enum: [
        "step1_intake_pending",
        "step1_intake_completed",
        "step2_screening_pending",
        "step2_screening_completed",
        "step2_screening_failed",
        "step3_pledge_pending",
        "step3_pledge_signed",
        "registration_completed",
      ],
      default: "step1_intake_pending",
    },
    currentStep: { type: Number, default: 1 },
    registrationCompletedAt: { type: Date },

    // ========== OPPORTUNITY YOUTH ELIGIBILITY ==========
    isOpportunityYouth: {
      type: Boolean,
      default: false,
    },

    // ========== PAYMENT FIELDS (NEW) ==========
    paymentRequired: {
      type: Boolean,
      default: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: "",
      index: true,
    },
    paymentAmount: {
      type: Number,
      default: 0,
      description: "Amount paid in dollars",
    },
    paymentCompletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Create full name virtual field
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user is fully registered
userSchema.methods.isFullyRegistered = function () {
  return this.registrationStatus === "registration_completed";
};

// Method to get registration progress percentage
userSchema.methods.getRegistrationProgress = function () {
  const steps = {
    step1_intake_pending: 0,
    step1_intake_completed: 25,
    step2_screening_pending: 25,
    step2_screening_completed: 50,
    step2_screening_failed: 50,
    step3_pledge_pending: 50,
    step3_pledge_signed: 75,
    registration_completed: 100,
  };
  return steps[this.registrationStatus] || 0;
};

// Ensure virtuals are included in JSON output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
