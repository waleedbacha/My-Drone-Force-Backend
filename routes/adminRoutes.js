const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  loginAdmin,
  getAdminProfile,
  setupDefaultAdmin,
} = require("../controllers/adminController");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getStats,
  getUserAgreement,
  updateUserOnboarding,
  getUserOnboardingProgress,
} = require("../controllers/userController");
const { getDashboardData } = require("../controllers/dashboardController");

const router = express.Router();

// Public routes
router.post("/login", loginAdmin);
router.post("/setup", setupDefaultAdmin);

// Protected routes (require admin login)
router.use(protect);

router.get("/me", getAdminProfile);
router.get("/stats", adminOnly, getStats);
router.get("/users", adminOnly, getUsers);
router.get("/users/:id", adminOnly, getUserById);
router.post("/users", adminOnly, createUser);
router.put("/users/:id", adminOnly, updateUser);
router.delete("/users/:id", adminOnly, deleteUser);
router.get("/users/:id/agreement", adminOnly, getUserAgreement);
router.get("/dashboard", adminOnly, getDashboardData);

// Onboarding routes (Step 4 - Admin only)
router.get("/users/:id/onboarding", adminOnly, getUserOnboardingProgress);
router.put("/users/:id/onboarding", adminOnly, updateUserOnboarding);

module.exports = router;
