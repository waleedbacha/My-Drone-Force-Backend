const User = require("../models/User");
const ScreeningRubric = require("../models/ScreeningRubric");
const ParticipantPledge = require("../models/ParticipantPledge");
const {
  sendRegistrationEmail,
  sendAdminNotification,
} = require("../utils/emailService");
const { validationResult } = require("express-validator");

// Helper function to calculate screening scores
const calculateScreeningScores = (data) => {
  // Section 1: Basic Eligibility
  const section1Score =
    (data.ageRequirement ? 1 : 0) +
    (data.validId ? 1 : 0) +
    (data.englishReadWrite ? 1 : 0);

  // Section 2: Technical Readiness
  const section2Score =
    (data.hasComputerTablet ? 1 : 0) +
    (data.hasInternet ? 1 : 0) +
    (data.comfortableZoom ? 1 : 0);

  // Section 3: Availability & Commitment
  const section3Score =
    (data.availableTraining ? 1 : 0) +
    (data.canAttendInPerson ? 1 : 0) +
    (data.canStudyDaily ? 1 : 0) +
    (data.canTakeExamWithin30Days ? 1 : 0);

  // Section 4: Motivation Indicators (2x weight)
  const section4Raw =
    (data.clearReasonForCert ? 1 : 0) +
    (data.careerInterest ? 1 : 0) +
    (data.willingSignPledge ? 1 : 0);
  const section4Score = section4Raw * 2;

  const totalScore =
    section1Score + section2Score + section3Score + section4Score;
  const percentage = (totalScore / 16) * 100;

  // Determine eligibility status
  const allBasicEligibilityMet = section1Score === 3;
  let eligibilityStatus = "not_eligible";
  let eligibilityMessage = "";

  if (!allBasicEligibilityMet) {
    eligibilityStatus = "not_eligible";
    eligibilityMessage = "Missing one or more Basic Eligibility requirements";
  } else if (totalScore >= 12) {
    eligibilityStatus = "eligible";
    eligibilityMessage = "✅ ELIGIBLE - Recommend for Program";
  } else {
    eligibilityStatus = "conditional";
    eligibilityMessage =
      "⚠️ CONDITIONAL - All Basic Eligibility met but Total Score < 12";
  }

  return {
    section1Score,
    section2Score,
    section3Score,
    section4Score,
    totalScore,
    percentage,
    eligibilityStatus,
    eligibilityMessage,
    allBasicEligibilityMet,
  };
};

// Helper function to parse commitment agreements
const parseCommitmentAgreements = (commitmentAgreements) => {
  if (!commitmentAgreements) return [];

  // If it's already an array, return it
  if (Array.isArray(commitmentAgreements)) {
    return commitmentAgreements;
  }

  // If it's a string, try to parse it as JSON
  if (typeof commitmentAgreements === "string") {
    try {
      const parsed = JSON.parse(commitmentAgreements);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error parsing commitmentAgreements:", e);
      return [];
    }
  }

  return [];
};

// Helper function to check if user is already fully registered
const isUserFullyRegistered = (user) => {
  return user.registrationStatus === "registration_completed";
};

// Helper function to get user registration state for resume
const getUserRegistrationState = (user) => {
  return {
    userId: user._id,
    registrationStatus: user.registrationStatus,
    paymentStatus: user.paymentStatus,
    eligibilityStatus: user.screeningRubric?.eligibilityStatus || null,
    currentStep: user.currentStep,
    isFullyRegistered: user.registrationStatus === "registration_completed",
    hasPaid: user.paymentStatus === "completed",
    canResume: true,
  };
};

// @desc    STEP 1: Candidate Intake Form
// @route   POST /api/auth/register/step1
// @access  Public
const registerStep1 = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      courseInterest,
      hearAboutUs,
      englishProficiency,
      programCommitment,
      techAccess,
      commitmentAgreements,
      electronicSignature,
      signatureDate,
      printedName,
    } = req.body;

    // Parse commitmentAgreements (handles JSON string or array)
    const parsedCommitmentAgreements =
      parseCommitmentAgreements(commitmentAgreements);

    // Check if user already exists
    let user = await User.findOne({ email });

    // Get IP address and User Agent
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    let profileImageUrl = "";
    if (req.file) {
      profileImageUrl = req.file.path;
    }

    // Convert boolean values (handles string "true"/"false" and actual booleans)
    const isEnglishProficiency =
      englishProficiency === true || englishProficiency === "true";
    const isProgramCommitment =
      programCommitment === true || programCommitment === "true";
    const isTechAccess = techAccess === true || techAccess === "true";

    console.log("Boolean values:", {
      englishProficiency: englishProficiency,
      isEnglishProficiency: isEnglishProficiency,
      programCommitment: programCommitment,
      isProgramCommitment: isProgramCommitment,
      techAccess: techAccess,
      isTechAccess: isTechAccess,
    });

    if (user) {
      // Update existing user (if they left and came back)
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = phone;
      user.dateOfBirth = dateOfBirth;
      user.address = address;
      user.city = city;
      user.state = state;
      user.zipCode = zipCode;
      user.courseInterest = courseInterest;
      user.hearAboutUs = hearAboutUs || "Other";
      user.profileImage = profileImageUrl || user.profileImage;
      user.englishProficiency = isEnglishProficiency;
      user.programCommitment = isProgramCommitment;
      user.techAccess = isTechAccess;
      user.commitmentAgreements = parsedCommitmentAgreements;
      user.electronicSignature = electronicSignature;
      user.signatureDate = signatureDate || new Date();
      user.printedName = printedName;
      user.signatureIpAddress = ipAddress;
      user.signatureUserAgent = userAgent;
      user.registrationStatus = "step1_intake_completed";
      user.currentStep = 2;

      await user.save();
    } else {
      // Create new user
      user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        address,
        city,
        state,
        zipCode,
        courseInterest,
        hearAboutUs: hearAboutUs || "Other",
        profileImage: profileImageUrl,
        englishProficiency: isEnglishProficiency,
        programCommitment: isProgramCommitment,
        techAccess: isTechAccess,
        commitmentAgreements: parsedCommitmentAgreements,
        electronicSignature,
        signatureDate: signatureDate || new Date(),
        printedName,
        signatureIpAddress: ipAddress,
        signatureUserAgent: userAgent,
        registrationStatus: "step1_intake_completed",
        currentStep: 2,
        registeredBy: "self",
        status: "active",
      });
    }

    res.status(200).json({
      success: true,
      message: "Step 1 completed successfully! Proceed to Step 2.",
      data: {
        userId: user._id,
        email: user.email,
        currentStep: 2,
        nextStep: "/api/auth/register/step2",
      },
    });
  } catch (error) {
    console.error("Step 1 error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error. Please try again later.",
    });
  }
};

// @desc    STEP 2: Candidate Screening Rubric
// @route   POST /api/auth/register/step2
// @access  Public
const registerStep2 = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      userId,
      ageRequirement,
      validId,
      englishReadWrite,
      hasComputerTablet,
      hasInternet,
      comfortableZoom,
      availableTraining,
      canAttendInPerson,
      canStudyDaily,
      canTakeExamWithin30Days,
      clearReasonForCert,
      careerInterest,
      willingSignPledge,
      notes,
    } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please complete Step 1 first.",
      });
    }

    // Calculate scores
    const screeningData = {
      ageRequirement: ageRequirement === true || ageRequirement === "true",
      validId: validId === true || validId === "true",
      englishReadWrite:
        englishReadWrite === true || englishReadWrite === "true",
      hasComputerTablet:
        hasComputerTablet === true || hasComputerTablet === "true",
      hasInternet: hasInternet === true || hasInternet === "true",
      comfortableZoom: comfortableZoom === true || comfortableZoom === "true",
      availableTraining:
        availableTraining === true || availableTraining === "true",
      canAttendInPerson:
        canAttendInPerson === true || canAttendInPerson === "true",
      canStudyDaily: canStudyDaily === true || canStudyDaily === "true",
      canTakeExamWithin30Days:
        canTakeExamWithin30Days === true || canTakeExamWithin30Days === "true",
      clearReasonForCert:
        clearReasonForCert === true || clearReasonForCert === "true",
      careerInterest: careerInterest === true || careerInterest === "true",
      willingSignPledge:
        willingSignPledge === true || willingSignPledge === "true",
    };

    const scores = calculateScreeningScores(screeningData);

    // Update user with screening results
    user.screeningRubric = {
      ageRequirement: screeningData.ageRequirement,
      validId: screeningData.validId,
      englishReadWrite: screeningData.englishReadWrite,
      hasComputerTablet: screeningData.hasComputerTablet,
      hasInternet: screeningData.hasInternet,
      comfortableZoom: screeningData.comfortableZoom,
      availableTraining: screeningData.availableTraining,
      canAttendInPerson: screeningData.canAttendInPerson,
      canStudyDaily: screeningData.canStudyDaily,
      canTakeExamWithin30Days: screeningData.canTakeExamWithin30Days,
      clearReasonForCert: screeningData.clearReasonForCert,
      careerInterest: screeningData.careerInterest,
      willingSignPledge: screeningData.willingSignPledge,
      section1Score: scores.section1Score,
      section2Score: scores.section2Score,
      section3Score: scores.section3Score,
      section4Score: scores.section4Score,
      totalScore: scores.totalScore,
      percentage: scores.percentage,
      eligibilityStatus: scores.eligibilityStatus,
      eligibilityMessage: scores.eligibilityMessage,
      evaluatorComments: notes || "",
      screeningCompleted: true,
      screeningCompletedAt: new Date(),
    };

    // Update registration status based on eligibility
    if (scores.eligibilityStatus === "eligible") {
      user.registrationStatus = "step2_screening_completed";
      user.currentStep = 3;
    } else if (scores.eligibilityStatus === "conditional") {
      user.registrationStatus = "step2_screening_completed";
      user.currentStep = 3;
    } else {
      user.registrationStatus = "step2_screening_failed";
      user.currentStep = 2;
    }

    await user.save();

    // Save to separate ScreeningRubric collection for audit
    await ScreeningRubric.create({
      userId: user._id,
      candidateName: `${user.firstName} ${user.lastName}`,
      ...screeningData,
      section1Score: scores.section1Score,
      section2Score: scores.section2Score,
      section3Score: scores.section3Score,
      section4Score: scores.section4Score,
      totalScore: scores.totalScore,
      percentage: scores.percentage,
      eligibilityStatus: scores.eligibilityStatus,
      eligibilityMessage: scores.eligibilityMessage,
      notes: notes || "",
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: scores.eligibilityMessage,
      data: {
        userId: user._id,
        scores: {
          section1Score: scores.section1Score,
          section2Score: scores.section2Score,
          section3Score: scores.section3Score,
          section4Score: scores.section4Score,
          totalScore: scores.totalScore,
          percentage: scores.percentage,
        },
        eligibilityStatus: scores.eligibilityStatus,
        eligibilityMessage: scores.eligibilityMessage,
        currentStep: user.currentStep,
        canProceed: scores.eligibilityStatus !== "not_eligible",
      },
    });
  } catch (error) {
    console.error("Step 2 error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// @desc    STEP 3: Participant Commitment Pledge
// @route   POST /api/auth/register/step3
// @access  Public
const registerStep3 = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      userId,
      cohortMonth,
      attendVirtualSessions,
      attendInPersonSessions,
      understandMissedImpact,
      activelyEngage,
      participateDiscussions,
      askQuestions,
      completeStudyMaterials,
      dedicateDailyStudy,
      participateGroupStudy,
      completePracticeExams,
      reviewIncorrectAnswers,
      scheduleExamWithin30Days,
      understandDelayImpact,
      understandSuccessLink,
      acknowledgeExpectations,
      participantSignature,
    } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please complete Steps 1 and 2 first.",
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Convert boolean values
    const isAttendVirtualSessions =
      attendVirtualSessions === true || attendVirtualSessions === "true";
    const isAttendInPersonSessions =
      attendInPersonSessions === true || attendInPersonSessions === "true";
    const isUnderstandMissedImpact =
      understandMissedImpact === true || understandMissedImpact === "true";
    const isActivelyEngage =
      activelyEngage === true || activelyEngage === "true";
    const isParticipateDiscussions =
      participateDiscussions === true || participateDiscussions === "true";
    const isAskQuestions = askQuestions === true || askQuestions === "true";
    const isCompleteStudyMaterials =
      completeStudyMaterials === true || completeStudyMaterials === "true";
    const isDedicateDailyStudy =
      dedicateDailyStudy === true || dedicateDailyStudy === "true";
    const isParticipateGroupStudy =
      participateGroupStudy === true || participateGroupStudy === "true";
    const isCompletePracticeExams =
      completePracticeExams === true || completePracticeExams === "true";
    const isReviewIncorrectAnswers =
      reviewIncorrectAnswers === true || reviewIncorrectAnswers === "true";
    const isScheduleExamWithin30Days =
      scheduleExamWithin30Days === true || scheduleExamWithin30Days === "true";
    const isUnderstandDelayImpact =
      understandDelayImpact === true || understandDelayImpact === "true";
    const isUnderstandSuccessLink =
      understandSuccessLink === true || understandSuccessLink === "true";
    const isAcknowledgeExpectations =
      acknowledgeExpectations === true || acknowledgeExpectations === "true";

    // Update user with pledge data
    user.cohortMonth = cohortMonth;
    user.participantPledge = {
      attendVirtualSessions: isAttendVirtualSessions,
      attendInPersonSessions: isAttendInPersonSessions,
      understandMissedImpact: isUnderstandMissedImpact,
      activelyEngage: isActivelyEngage,
      participateDiscussions: isParticipateDiscussions,
      askQuestions: isAskQuestions,
      completeStudyMaterials: isCompleteStudyMaterials,
      dedicateDailyStudy: isDedicateDailyStudy,
      participateGroupStudy: isParticipateGroupStudy,
      completePracticeExams: isCompletePracticeExams,
      reviewIncorrectAnswers: isReviewIncorrectAnswers,
      scheduleExamWithin30Days: isScheduleExamWithin30Days,
      understandDelayImpact: isUnderstandDelayImpact,
      understandSuccessLink: isUnderstandSuccessLink,
      acknowledgeExpectations: isAcknowledgeExpectations,
      participantSignature,
      pledgeSignedDate: new Date(),
      pledgeSignedAt: new Date(),
      pledgeIpAddress: ipAddress,
      pledgeUserAgent: userAgent,
      pledgeCompleted: true,
    };

    user.registrationStatus = "registration_completed";
    user.currentStep = 5;

    await user.save();

    // Save to separate ParticipantPledge collection for legal audit
    await ParticipantPledge.create({
      userId: user._id,
      participantName: `${user.firstName} ${user.lastName}`,
      cohortMonth,
      attendVirtualSessions: isAttendVirtualSessions,
      attendInPersonSessions: isAttendInPersonSessions,
      understandMissedImpact: isUnderstandMissedImpact,
      activelyEngage: isActivelyEngage,
      participateDiscussions: isParticipateDiscussions,
      askQuestions: isAskQuestions,
      completeStudyMaterials: isCompleteStudyMaterials,
      dedicateDailyStudy: isDedicateDailyStudy,
      participateGroupStudy: isParticipateGroupStudy,
      completePracticeExams: isCompletePracticeExams,
      reviewIncorrectAnswers: isReviewIncorrectAnswers,
      scheduleExamWithin30Days: isScheduleExamWithin30Days,
      understandDelayImpact: isUnderstandDelayImpact,
      understandSuccessLink: isUnderstandSuccessLink,
      acknowledgeExpectations: isAcknowledgeExpectations,
      participantSignature,
      signatureDate: new Date(),
      ipAddress,
      userAgent,
    });

    // Send email notifications (don't await to avoid blocking)
    sendRegistrationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
    ).catch((err) => console.error("Error sending registration email:", err));
    sendAdminNotification({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      courseInterest: user.courseInterest,
    }).catch((err) => console.error("Error sending admin notification:", err));

    res.status(200).json({
      success: true,
      message:
        "Registration completed successfully! A confirmation email has been sent.",
      data: {
        userId: user._id,
        email: user.email,
        registrationCompleted: true,
      },
    });
  } catch (error) {
    console.error("Step 3 error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error. Please try again later.",
    });
  }
};

// @desc    Check if email exists
// @route   POST /api/auth/check-email
// @access  Public
// @desc    Check if email exists and return registration state
// @route   POST /api/auth/check-email
// @access  Public
// @desc    Check if email exists and return registration state
// @route   POST /api/auth/check-email
// @access  Public
const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: true,
        exists: false,
        message: "No email provided",
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      // ✅ FIX: Treat both as fully registered
      const isFullyRegistered =
        user.registrationStatus === "registration_completed" ||
        user.registrationStatus === "step3_pledge_signed";

      console.log(
        `Email: ${email}, Status: ${user.registrationStatus}, isFullyRegistered: ${isFullyRegistered}`,
      );

      return res.json({
        success: true,
        exists: true,
        isFullyRegistered: isFullyRegistered,
        message: isFullyRegistered
          ? "This email is already registered. Please contact support."
          : "An incomplete registration exists for this email. You can continue where you left off.",
        userId: user._id,
        registrationStatus: user.registrationStatus,
        paymentStatus: user.paymentStatus,
        currentStep: user.currentStep,
      });
    }

    res.json({
      success: true,
      exists: false,
      message: "Email is available for registration",
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get registration progress for a user
// @route   GET /api/auth/progress/:userId
// @access  Public
const getRegistrationProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        registrationStatus: user.registrationStatus,
        currentStep: user.currentStep,
        progressPercentage: user.getRegistrationProgress(),
        isFullyRegistered: user.isFullyRegistered(),
        screeningResults: user.screeningRubric?.eligibilityStatus,
      },
    });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerStep1,
  registerStep2,
  registerStep3,
  checkEmail,
  getRegistrationProgress,
};
