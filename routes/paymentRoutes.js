const express = require("express");
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
} = require("../controllers/paymentController");

const router = express.Router();

// Public routes (userId is passed in body/params)
router.post("/create-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);
router.get("/status/:userId", getPaymentStatus);

module.exports = router;
