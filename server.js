const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ========== STRIPE WEBHOOK (MUST BE BEFORE express.json) ==========
// Stripe webhook needs raw body for signature verification
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const { handleStripeWebhook } = require("./controllers/paymentController");
    handleStripeWebhook(req, res);
  },
);

// ========== REGULAR MIDDLEWARE ==========
// Updated CORS configuration for production
const allowedOrigins = [
  "http://localhost:3000",
  "https://my-drone-force.vercel.app",
  "https://my-drone-force-git-main.vercel.app",
  "https://my-drone-force.vercel.app",
  "https://mydroneforce.com",
  "https://www.mydroneforce.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ========== ROUTES ==========
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/onboarding", require("./routes/onboardingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes")); // ← ADD THIS

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!", success: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(
    `📧 Email notifications: ${process.env.EMAIL_USER ? "Configured" : "Not configured"}`,
  );
  console.log(
    `💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? "Configured" : "Not configured"}`,
  );
});
