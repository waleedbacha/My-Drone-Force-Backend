const User = require("../models/User");

// @desc    Get all users (with pagination)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const courseFilter = req.query.course || "";
    const statusFilter = req.query.status || "";

    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (courseFilter) {
      filter.courseInterest = courseFilter;
    }

    if (statusFilter) {
      filter.status = statusFilter;
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create user (admin)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
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
      status,
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = await User.create({
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
      status: status || "active",
      registeredBy: "admin",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      courseInterest,
      hearAboutUs,
      status,
    } = req.body;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.zipCode = zipCode || user.zipCode;
    user.courseInterest = courseInterest || user.courseInterest;
    user.hearAboutUs = hearAboutUs || user.hearAboutUs;
    user.status = status || user.status;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const inactiveUsers = await User.countDocuments({ status: "inactive" });

    // Get current month start date
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Course distribution
    const courseDistribution = await User.aggregate([
      { $group: { _id: "$courseInterest", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Registrations by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const registrationsByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newThisMonth,
        courseDistribution: courseDistribution.map((item) => ({
          course: item._id,
          count: item.count,
        })),
        registrationsByMonth,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const getUserAgreement = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "firstName lastName electronicSignature signatureDate printedName commitmentAgreements signatureIpAddress signatureUserAgent onboardingCompleted onboardingCompletedAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      agreement: {
        userName: `${user.firstName} ${user.lastName}`,
        electronicSignature: user.electronicSignature,
        signatureDate: user.signatureDate,
        printedName: user.printedName,
        commitments: user.commitmentAgreements,
        ipAddress: user.signatureIpAddress,
        userAgent: user.signatureUserAgent,
        onboardingCompleted: user.onboardingCompleted,
        onboardingCompletedAt: user.onboardingCompletedAt,
      },
    });
  } catch (error) {
    console.error("Get agreement error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user onboarding progress
// @route   GET /api/admin/users/:id/onboarding
// @access  Private/Admin
const getUserOnboardingProgress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "firstName lastName email phone courseInterest cohortMonth registrationStatus",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
          registrationStatus: user.registrationStatus,
        },
        onboarding: user.onboardingProgress || {},
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

// @desc    Update user onboarding progress
// @route   PUT /api/admin/users/:id/onboarding
// @access  Private/Admin
const updateUserOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { onboardingProgress } = req.body;

    // Merge existing onboarding progress with updates
    user.onboardingProgress = {
      ...user.onboardingProgress,
      ...onboardingProgress,
      lastUpdatedBy: req.admin._id,
      lastUpdatedAt: new Date(),
    };

    await user.save();

    res.json({
      success: true,
      message: "Onboarding progress updated successfully",
      data: user.onboardingProgress,
    });
  } catch (error) {
    console.error("Update onboarding error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getStats,
  getUserAgreement,
  getUserOnboardingProgress,
  updateUserOnboarding,
};
