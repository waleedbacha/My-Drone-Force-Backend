const User = require("../models/User");
const OnboardingProgress = require("../models/OnboardingProgress");
const {
  getRegionByState,
  getAllRegions,
  getStatesByRegion,
  isInTargetRegion,
} = require("../utils/regionMapping");

// @desc    Get complete dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardData = async (req, res) => {
  try {
    // FIXED: Include users who have completed screening (Step 2) OR full registration
    const allUsers = await User.find({
      $or: [
        { registrationStatus: "registration_completed" },
        { registrationStatus: "step2_screening_completed" },
        { registrationStatus: "step3_pledge_signed" },
      ],
    });

    // Get all onboarding progress data (for users who have started onboarding)
    const onboardingProgressList = await OnboardingProgress.find({});

    // ========== 1. KPI CALCULATIONS ==========
    const totalParticipants = allUsers.length;

    // FIXED: Count eligible based on screening rubric, NOT registration status
    const eligible = allUsers.filter(
      (u) => u.screeningRubric?.eligibilityStatus === "eligible",
    ).length;

    const conditional = allUsers.filter(
      (u) => u.screeningRubric?.eligibilityStatus === "conditional",
    ).length;

    const notEligible = allUsers.filter(
      (u) => u.screeningRubric?.eligibilityStatus === "not_eligible",
    ).length;

    // Users who haven't completed screening yet
    const pendingScreening = allUsers.filter(
      (u) =>
        !u.screeningRubric?.eligibilityStatus &&
        u.registrationStatus !== "registration_completed",
    ).length;

    // FAA Passed - from onboarding progress (only for fully registered users)
    let faaPassed = 0;
    let faaScheduled = 0;
    let faaNotYet = 0;
    let faaFailed = 0;

    onboardingProgressList.forEach((progress) => {
      const result = progress.finalOutcome?.faaExamResult;
      if (result === "PASSED") faaPassed++;
      else if (result === "FAILED") faaFailed++;
      else if (result === "PENDING") {
        if (progress.phase4?.examScheduledDate) faaScheduled++;
        else faaNotYet++;
      }
    });

    const totalExamTaken = faaPassed + faaFailed;
    const passRate =
      totalExamTaken > 0 ? Math.round((faaPassed / totalExamTaken) * 100) : 0;

    // ========== 2. SCREENING SCORE ANALYSIS ==========
    // FIXED: Include all users who have screening scores (eligible, conditional, or not eligible)
    const scores = allUsers
      .filter(
        (u) =>
          u.screeningRubric?.totalScore !== undefined &&
          u.screeningRubric?.totalScore > 0,
      )
      .map((u) => ({
        totalScore: u.screeningRubric.totalScore,
        percentage: u.screeningRubric.percentage,
        section1: u.screeningRubric.section1Score,
        section2: u.screeningRubric.section2Score,
        section3: u.screeningRubric.section3Score,
        section4: u.screeningRubric.section4Score,
      }));

    const calculateMetrics = (values) => {
      if (values.length === 0) return { avg: 0, max: 0, min: 0, median: 0 };
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return {
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
        max: Math.max(...values),
        min: Math.min(...values),
        median:
          sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid],
      };
    };

    const totalScores = scores.map((s) => s.totalScore);
    const percentages = scores.map((s) => s.percentage);
    const section1Scores = scores.map((s) => s.section1);
    const section2Scores = scores.map((s) => s.section2);
    const section3Scores = scores.map((s) => s.section3);
    const section4Scores = scores.map((s) => s.section4);

    // ========== 3. PRACTICE EXAM PERFORMANCE ==========
    const practiceExams = {
      exam1: { scores: [], completed: 0 },
      exam2: { scores: [], completed: 0 },
      exam3: { scores: [], completed: 0 },
    };

    onboardingProgressList.forEach((progress) => {
      if (
        progress.phase4?.practiceExam1Completed &&
        progress.phase4?.practiceExam1Score > 0
      ) {
        practiceExams.exam1.scores.push(progress.phase4.practiceExam1Score);
        practiceExams.exam1.completed++;
      }
      if (
        progress.phase4?.practiceExam2Completed &&
        progress.phase4?.practiceExam2Score > 0
      ) {
        practiceExams.exam2.scores.push(progress.phase4.practiceExam2Score);
        practiceExams.exam2.completed++;
      }
      if (
        progress.phase4?.practiceExam3Completed &&
        progress.phase4?.practiceExam3Score > 0
      ) {
        practiceExams.exam3.scores.push(progress.phase4.practiceExam3Score);
        practiceExams.exam3.completed++;
      }
    });

    // ========== 4. PHASE COMPLETION TRACKING ==========
    const phaseStats = {
      phase1: { total: 5, completed: 0 },
      phase2: { total: 6, completed: 0 },
      phase3: { total: 4, completed: 0 },
      phase4: { total: 12, completed: 0 },
    };

    onboardingProgressList.forEach((progress) => {
      const phase1Tasks = [
        progress.phase1?.applicationReceived,
        progress.phase1?.screeningCompleted,
        progress.phase1?.pledgeSigned,
        progress.phase1?.orientationCallScheduled,
        progress.phase1?.orientationCompleted,
      ].filter(Boolean).length;
      phaseStats.phase1.completed += phase1Tasks;

      const phase2Tasks = [
        progress.phase2?.studyMaterialsProvided,
        progress.phase2?.loginInstructionsSent,
        progress.phase2?.classScheduleShared,
        progress.phase2?.examOverviewProvided,
        progress.phase2?.studyGuidanceProvided,
        progress.phase2?.day1PreWorkAssigned,
      ].filter(Boolean).length;
      phaseStats.phase2.completed += phase2Tasks;

      const phase3Tasks = [
        progress.phase3?.day1Completed,
        progress.phase3?.day2Completed,
        progress.phase3?.day3Completed,
        progress.phase3?.engagementVerified,
      ].filter(Boolean).length;
      phaseStats.phase3.completed += phase3Tasks;

      const phase4Tasks = [
        progress.phase4?.dailyStudyConfirmed,
        progress.phase4?.practiceExam1Completed,
        progress.phase4?.groupStudyAttended,
        progress.phase4?.practiceExam2Completed,
        progress.phase4?.weakAreasIdentified,
        progress.phase4?.targetedReviewCompleted,
        progress.phase4?.practiceExam3Completed,
        progress.phase4?.requiredScoreAchieved,
        progress.phase4?.examReadinessAttended,
        progress.phase4?.lastMinuteCramAttended,
        progress.phase4?.practiceScore80Percent,
        progress.phase4?.participantConfident,
      ].filter(Boolean).length;
      phaseStats.phase4.completed += phase4Tasks;
    });

    // ========== 5. AGE DEMOGRAPHICS ==========
    const today = new Date();
    const ages = allUsers
      .map((user) => {
        if (!user.dateOfBirth) return null;
        const birthDate = new Date(user.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
      })
      .filter((age) => age !== null && age > 0);

    const ageMetrics = calculateMetrics(ages);
    const opportunityYouth = ages.filter(
      (age) => age >= 16 && age <= 24,
    ).length;
    const age25Plus = ages.filter((age) => age >= 25).length;

    // ========== 6. COHORT SUMMARY ==========
    const cohortMap = new Map();
    allUsers.forEach((user) => {
      if (user.cohortMonth) {
        cohortMap.set(
          user.cohortMonth,
          (cohortMap.get(user.cohortMonth) || 0) + 1,
        );
      }
    });
    const cohortSummary = Array.from(cohortMap.entries())
      .map(([cohort, count]) => ({ cohort, count }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort));

    // ========== 7. FAA EXAM RESULTS BREAKDOWN ==========
    const examResults = {
      passed: faaPassed,
      failed: faaFailed,
      scheduled: faaScheduled,
      notYet: faaNotYet,
      total: onboardingProgressList.length,
    };

    // ========== 8. GOAL TRACKING ==========
    const goal = 60;
    const goalStatus = passRate >= goal ? "✅ ACHIEVED" : "⚠️ BELOW GOAL";
    const goalColor = passRate >= goal ? "#10b981" : "#f59e0b";

    // ========== 9. REGION BREAKDOWN (NEW) ==========
    const regionBreakdown = {
      "Core Mid-South": 0,
      "Deep South": 0,
      Other: 0,
      Unknown: 0,
    };

    allUsers.forEach((user) => {
      const region = getRegionByState(user.state);
      regionBreakdown[region]++;
    });

    // Calculate region percentages
    const totalUsersWithState = allUsers.filter((u) => u.state).length;
    const regionPercentages = {};
    Object.keys(regionBreakdown).forEach((region) => {
      regionPercentages[region] =
        totalUsersWithState > 0
          ? Math.round((regionBreakdown[region] / totalUsersWithState) * 100)
          : 0;
    });

    // Prepare data for frontend charts
    const regionChartData = Object.keys(regionBreakdown)
      .filter((region) => region !== "Unknown")
      .map((region) => ({
        region: region,
        count: regionBreakdown[region],
        percentage: regionPercentages[region],
      }));

    // ========== 10. TARGET REGION STUDENTS (Core Mid-South + Deep South combined) ==========
    const targetRegionStudents =
      regionBreakdown["Core Mid-South"] + regionBreakdown["Deep South"];
    const targetRegionPercentage =
      totalUsersWithState > 0
        ? Math.round((targetRegionStudents / totalUsersWithState) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        kpi: {
          totalParticipants,
          eligible,
          conditional,
          notEligible,
          pendingScreening,
          faaPassed,
          passRate,
        },
        screeningAnalysis: {
          totalScore: calculateMetrics(totalScores),
          percentage: calculateMetrics(percentages),
          section1: calculateMetrics(section1Scores),
          section2: calculateMetrics(section2Scores),
          section3: calculateMetrics(section3Scores),
          section4: calculateMetrics(section4Scores),
        },
        practiceExams: {
          exam1: {
            avg: practiceExams.exam1.scores.length
              ? (
                  practiceExams.exam1.scores.reduce((a, b) => a + b, 0) /
                  practiceExams.exam1.scores.length
                ).toFixed(0)
              : 0,
            highest: Math.max(...practiceExams.exam1.scores, 0),
            lowest: Math.min(...practiceExams.exam1.scores, 100),
            completed: practiceExams.exam1.completed,
          },
          exam2: {
            avg: practiceExams.exam2.scores.length
              ? (
                  practiceExams.exam2.scores.reduce((a, b) => a + b, 0) /
                  practiceExams.exam2.scores.length
                ).toFixed(0)
              : 0,
            highest: Math.max(...practiceExams.exam2.scores, 0),
            lowest: Math.min(...practiceExams.exam2.scores, 100),
            completed: practiceExams.exam2.completed,
          },
          exam3: {
            avg: practiceExams.exam3.scores.length
              ? (
                  practiceExams.exam3.scores.reduce((a, b) => a + b, 0) /
                  practiceExams.exam3.scores.length
                ).toFixed(0)
              : 0,
            highest: Math.max(...practiceExams.exam3.scores, 0),
            lowest: Math.min(...practiceExams.exam3.scores, 100),
            completed: practiceExams.exam3.completed,
          },
        },
        phaseCompletion: {
          phase1: {
            completed: phaseStats.phase1.completed,
            total: phaseStats.phase1.total * onboardingProgressList.length,
            percentage:
              phaseStats.phase1.total * onboardingProgressList.length > 0
                ? Math.round(
                    (phaseStats.phase1.completed /
                      (phaseStats.phase1.total *
                        onboardingProgressList.length)) *
                      100,
                  )
                : 0,
          },
          phase2: {
            completed: phaseStats.phase2.completed,
            total: phaseStats.phase2.total * onboardingProgressList.length,
            percentage:
              phaseStats.phase2.total * onboardingProgressList.length > 0
                ? Math.round(
                    (phaseStats.phase2.completed /
                      (phaseStats.phase2.total *
                        onboardingProgressList.length)) *
                      100,
                  )
                : 0,
          },
          phase3: {
            completed: phaseStats.phase3.completed,
            total: phaseStats.phase3.total * onboardingProgressList.length,
            percentage:
              phaseStats.phase3.total * onboardingProgressList.length > 0
                ? Math.round(
                    (phaseStats.phase3.completed /
                      (phaseStats.phase3.total *
                        onboardingProgressList.length)) *
                      100,
                  )
                : 0,
          },
          phase4: {
            completed: phaseStats.phase4.completed,
            total: phaseStats.phase4.total * onboardingProgressList.length,
            percentage:
              phaseStats.phase4.total * onboardingProgressList.length > 0
                ? Math.round(
                    (phaseStats.phase4.completed /
                      (phaseStats.phase4.total *
                        onboardingProgressList.length)) *
                      100,
                  )
                : 0,
          },
        },
        demographics: {
          averageAge: ageMetrics.avg,
          youngest: ageMetrics.min,
          oldest: ageMetrics.max,
          opportunityYouth,
          age25Plus,
        },
        cohortSummary,
        examResults,
        goal: {
          target: goal,
          current: passRate,
          status: goalStatus,
          color: goalColor,
        },
        // NEW: Region breakdown data
        regionBreakdown: regionBreakdown,
        regionPercentages: regionPercentages,
        regionChartData: regionChartData,
        targetRegionStudents: targetRegionStudents,
        targetRegionPercentage: targetRegionPercentage,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

module.exports = { getDashboardData };
