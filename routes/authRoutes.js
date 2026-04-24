const express = require("express");
const { body } = require("express-validator");
const {
  registerStep1,
  registerStep2,
  registerStep3,
  checkEmail,
  getRegistrationProgress,
} = require("../controllers/authController");
const { uploadSingle } = require("../middleware/uploadMiddleware");

const router = express.Router();

// ========== STEP 1: CANDIDATE INTAKE FORM ==========
const validateStep1 = [
  // Personal Information
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),

  // Address
  body("address").notEmpty().withMessage("Address is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("zipCode").notEmpty().withMessage("ZIP code is required"),

  // Course
  body("courseInterest").notEmpty().withMessage("Course interest is required"),

  // Onboarding Verification Checklist - Accept true or "true"
  body("englishProficiency")
    .custom((value) => value === true || value === "true")
    .withMessage("English proficiency is required"),
  body("programCommitment")
    .custom((value) => value === true || value === "true")
    .withMessage("Program commitment is required"),
  body("techAccess")
    .custom((value) => value === true || value === "true")
    .withMessage("Technology access is required"),

  // Basic Commitments - Accept JSON string or array
  body("commitmentAgreements")
    .custom((value) => {
      if (!value) return false;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) && parsed.length >= 4;
        } catch {
          return false;
        }
      }
      if (Array.isArray(value)) {
        return value.length >= 4;
      }
      return false;
    })
    .withMessage("All commitment agreements must be accepted"),

  body("electronicSignature")
    .notEmpty()
    .withMessage("Electronic signature is required"),
  body("printedName").notEmpty().withMessage("Printed name is required"),
  body("signatureDate").notEmpty().withMessage("Signature date is required"),
];

// ========== STEP 2: SCREENING RUBRIC ==========
const validateStep2 = [
  // Section 1: Basic Eligibility
  body("ageRequirement").isBoolean().withMessage("Age requirement is required"),
  body("validId").isBoolean().withMessage("Valid ID is required"),
  body("englishReadWrite")
    .isBoolean()
    .withMessage("English proficiency is required"),

  // Section 2: Technical Readiness
  body("hasComputerTablet")
    .isBoolean()
    .withMessage("Computer/tablet access is required"),
  body("hasInternet").isBoolean().withMessage("Internet access is required"),
  body("comfortableZoom").isBoolean().withMessage("Zoom comfort is required"),

  // Section 3: Availability & Commitment
  body("availableTraining")
    .isBoolean()
    .withMessage("Training availability is required"),
  body("canAttendInPerson")
    .isBoolean()
    .withMessage("In-person attendance is required"),
  body("canStudyDaily").isBoolean().withMessage("Study commitment is required"),
  body("canTakeExamWithin30Days")
    .isBoolean()
    .withMessage("Exam commitment is required"),

  // Section 4: Motivation Indicators
  body("clearReasonForCert")
    .isBoolean()
    .withMessage("Reason for certification is required"),
  body("careerInterest").isBoolean().withMessage("Career interest is required"),
  body("willingSignPledge")
    .isBoolean()
    .withMessage("Pledge agreement is required"),
];

// ========== STEP 3: PARTICIPANT PLEDGE ==========
const validateStep3 = [
  body("cohortMonth").notEmpty().withMessage("Cohort month is required"),

  // Attendance Commitment
  body("attendVirtualSessions")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Virtual sessions commitment is required"),
  body("attendInPersonSessions")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("In-person sessions commitment is required"),
  body("understandMissedImpact")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Missed sessions acknowledgment is required"),

  // Active Participation
  body("activelyEngage")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Active engagement commitment is required"),
  body("participateDiscussions")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Discussion participation is required"),
  body("askQuestions")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Questions commitment is required"),

  // Study Commitment
  body("completeStudyMaterials")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Study materials commitment is required"),
  body("dedicateDailyStudy")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Daily study commitment is required"),
  body("participateGroupStudy")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Group study commitment is required"),

  // Practice Exam Requirement
  body("completePracticeExams")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Practice exams commitment is required"),
  body("reviewIncorrectAnswers")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Review incorrect answers commitment is required"),

  // FAA Exam Commitment
  body("scheduleExamWithin30Days")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Exam scheduling commitment is required"),
  body("understandDelayImpact")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Delay impact acknowledgment is required"),

  // Accountability
  body("understandSuccessLink")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Success link acknowledgment is required"),
  body("acknowledgeExpectations")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("Expectations acknowledgment is required"),

  // Signature
  body("participantSignature")
    .notEmpty()
    .withMessage("Participant signature is required"),
];

// Routes
router.post("/register/step1", uploadSingle, validateStep1, registerStep1);
router.post("/register/step2", validateStep2, registerStep2);
router.post("/register/step3", validateStep3, registerStep3);
router.post("/check-email", checkEmail);
router.get("/progress/:userId", getRegistrationProgress);

module.exports = router;
