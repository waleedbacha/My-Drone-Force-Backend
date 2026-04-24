const OnboardingProgress = require("../models/OnboardingProgress");
const User = require("../models/User");

// @desc    Get onboarding progress for a user
// @route   GET /api/onboarding/:userId
// @access  Private/Admin
const getOnboardingProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "firstName lastName email phone courseInterest cohortMonth",
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let onboarding = await OnboardingProgress.findOne({ userId });

    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          courseInterest: user.courseInterest,
          cohortMonth: user.cohortMonth || "Not assigned",
        },
        onboarding,
        progressPercentage: onboarding.getProgressPercentage(),
      },
    });
  } catch (error) {
    console.error("Get onboarding error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update Phase 1: Pre-Enrollment
// @route   PUT /api/onboarding/:userId/phase1
// @access  Private/Admin
const updatePhase1 = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const adminId = req.admin._id;

    let onboarding = await OnboardingProgress.findOne({ userId });
    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    Object.keys(updates).forEach((key) => {
      if (onboarding.phase1.hasOwnProperty(key)) {
        onboarding.phase1[key] = updates[key];
        if (updates[key] === true && !onboarding.phase1[`${key}Date`]) {
          onboarding.phase1[`${key}Date`] = new Date();
        }
      }
    });

    onboarding.lastUpdatedBy = adminId;
    onboarding.lastUpdatedAt = new Date();

    await onboarding.save();

    res.json({
      success: true,
      message: "Phase 1 updated successfully",
      data: onboarding.phase1,
    });
  } catch (error) {
    console.error("Update phase1 error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update Phase 2: Week 0 Setup
// @route   PUT /api/onboarding/:userId/phase2
// @access  Private/Admin
const updatePhase2 = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const adminId = req.admin._id;

    let onboarding = await OnboardingProgress.findOne({ userId });
    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    Object.keys(updates).forEach((key) => {
      if (onboarding.phase2.hasOwnProperty(key)) {
        onboarding.phase2[key] = updates[key];
        if (updates[key] === true && !onboarding.phase2[`${key}Date`]) {
          onboarding.phase2[`${key}Date`] = new Date();
        }
      }
    });

    onboarding.lastUpdatedBy = adminId;
    onboarding.lastUpdatedAt = new Date();

    await onboarding.save();

    res.json({
      success: true,
      message: "Phase 2 updated successfully",
      data: onboarding.phase2,
    });
  } catch (error) {
    console.error("Update phase2 error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update Phase 3: Training Period
// @route   PUT /api/onboarding/:userId/phase3
// @access  Private/Admin
const updatePhase3 = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const adminId = req.admin._id;

    let onboarding = await OnboardingProgress.findOne({ userId });
    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    Object.keys(updates).forEach((key) => {
      if (onboarding.phase3.hasOwnProperty(key)) {
        onboarding.phase3[key] = updates[key];
        if (updates[key] === true && !onboarding.phase3[`${key}Date`]) {
          onboarding.phase3[`${key}Date`] = new Date();
        }
      }
    });

    onboarding.lastUpdatedBy = adminId;
    onboarding.lastUpdatedAt = new Date();

    await onboarding.save();

    res.json({
      success: true,
      message: "Phase 3 updated successfully",
      data: onboarding.phase3,
    });
  } catch (error) {
    console.error("Update phase3 error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update Phase 4: Post-Training
// @route   PUT /api/onboarding/:userId/phase4
// @access  Private/Admin
const updatePhase4 = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const adminId = req.admin._id;

    let onboarding = await OnboardingProgress.findOne({ userId });
    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    Object.keys(updates).forEach((key) => {
      if (onboarding.phase4.hasOwnProperty(key)) {
        onboarding.phase4[key] = updates[key];
        if (updates[key] === true && !onboarding.phase4[`${key}Date`]) {
          onboarding.phase4[`${key}Date`] = new Date();
        }
      }
    });

    onboarding.lastUpdatedBy = adminId;
    onboarding.lastUpdatedAt = new Date();

    await onboarding.save();

    res.json({
      success: true,
      message: "Phase 4 updated successfully",
      data: onboarding.phase4,
    });
  } catch (error) {
    console.error("Update phase4 error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update Accountability Check-ins
// @route   PUT /api/onboarding/:userId/accountability
// @access  Private/Admin
const updateAccountability = async (req, res) => {
  try {
    const { userId } = req.params;
    const { week, completed, response } = req.body;
    const adminId = req.admin._id;

    let onboarding = await OnboardingProgress.findOne({ userId });
    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    const weekKey = week === 4 ? "finalCheckin" : `week${week}Checkin`;
    if (onboarding.accountability[weekKey]) {
      onboarding.accountability[weekKey].completed = completed;
      onboarding.accountability[weekKey].response = response || "";
      if (completed) {
        onboarding.accountability[weekKey].date = new Date();
      }
    }

    onboarding.lastUpdatedBy = adminId;
    onboarding.lastUpdatedAt = new Date();

    await onboarding.save();

    res.json({
      success: true,
      message: `Week ${week} check-in updated successfully`,
      data: onboarding.accountability,
    });
  } catch (error) {
    console.error("Update accountability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update Final Outcome
// @route   PUT /api/onboarding/:userId/final-outcome
// @access  Private/Admin
const updateFinalOutcome = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      faaExamDate,
      faaExamResult,
      finalScore,
      evaluatorName,
      evaluatorSignature,
    } = req.body;
    const adminId = req.admin._id;

    let onboarding = await OnboardingProgress.findOne({ userId });
    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    onboarding.finalOutcome.faaExamDate =
      faaExamDate || onboarding.finalOutcome.faaExamDate;
    onboarding.finalOutcome.faaExamResult =
      faaExamResult || onboarding.finalOutcome.faaExamResult;
    onboarding.finalOutcome.finalScore =
      finalScore || onboarding.finalOutcome.finalScore;
    onboarding.finalOutcome.evaluatorName =
      evaluatorName || onboarding.finalOutcome.evaluatorName;
    onboarding.finalOutcome.evaluatorSignature =
      evaluatorSignature || onboarding.finalOutcome.evaluatorSignature;
    onboarding.finalOutcome.evaluatorDate = new Date();

    // If exam passed, mark program as completed
    if (faaExamResult === "PASSED") {
      onboarding.programCompleted = true;
      onboarding.programCompletedAt = new Date();
      onboarding.graduationDate = new Date();
    }

    onboarding.lastUpdatedBy = adminId;
    onboarding.lastUpdatedAt = new Date();

    await onboarding.save();

    res.json({
      success: true,
      message: "Final outcome updated successfully",
      data: onboarding.finalOutcome,
    });
  } catch (error) {
    console.error("Update final outcome error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Mark program as completed
// @route   POST /api/onboarding/:userId/complete
// @access  Private/Admin
const completeProgram = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.admin._id;

    let onboarding = await OnboardingProgress.findOne({ userId });
    if (!onboarding) {
      onboarding = await OnboardingProgress.create({ userId });
    }

    onboarding.programCompleted = true;
    onboarding.programCompletedAt = new Date();
    onboarding.graduationDate = new Date();
    onboarding.lastUpdatedBy = adminId;
    onboarding.lastUpdatedAt = new Date();

    await onboarding.save();

    // Update user status
    await User.findByIdAndUpdate(userId, { status: "completed" });

    res.json({
      success: true,
      message: "Program marked as completed successfully",
      data: {
        programCompleted: onboarding.programCompleted,
        programCompletedAt: onboarding.programCompletedAt,
        graduationDate: onboarding.graduationDate,
      },
    });
  } catch (error) {
    console.error("Complete program error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getOnboardingProgress,
  updatePhase1,
  updatePhase2,
  updatePhase3,
  updatePhase4,
  updateAccountability,
  updateFinalOutcome,
  completeProgram,
};
