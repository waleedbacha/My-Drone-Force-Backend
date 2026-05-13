const stripe = require("../utils/stripe");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { sendPaymentConfirmationEmail } = require("../utils/emailService");

// Course price from environment (in dollars)
const COURSE_PRICE_DOLLARS = parseInt(process.env.COURSE_PRICE) || 1500;
const COURSE_PRICE_CENTS = COURSE_PRICE_DOLLARS * 100;

/**
 * @desc    Create Stripe Payment Intent
 * @route   POST /api/payment/create-intent
 * @access  Public (requires userId from registration)
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    console.log("Backend: Create payment intent called for user:", userId);
    console.log("Backend: Course price:", COURSE_PRICE_DOLLARS);
    console.log("Backend: Request body:", { userId, email, name });
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user in database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is eligible to pay
    const eligibilityStatus = user.screeningRubric?.eligibilityStatus;
    if (
      eligibilityStatus !== "eligible" &&
      eligibilityStatus !== "conditional"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not eligible for program. Cannot process payment.",
        eligibilityStatus: eligibilityStatus,
      });
    }

    // Check if payment already completed
    if (user.paymentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed. Please continue registration.",
        paymentCompleted: true,
      });
    }

    // Check if there's a pending payment intent that hasn't expired
    if (user.stripePaymentIntentId && user.paymentStatus === "pending") {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          user.stripePaymentIntentId,
        );

        // If the intent is still pending, reuse it
        if (
          existingIntent.status === "requires_payment_method" ||
          existingIntent.status === "requires_confirmation" ||
          existingIntent.status === "requires_action"
        ) {
          return res.json({
            success: true,
            clientSecret: existingIntent.client_secret,
            paymentIntentId: existingIntent.id,
            amount: COURSE_PRICE_DOLLARS,
            currency: "usd",
            existing: true,
          });
        }
      } catch (err) {
        console.log("Existing intent not found or expired, creating new one");
      }
    }

    // Create new payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: COURSE_PRICE_CENTS,
      currency: "usd",
      metadata: {
        userId: userId.toString(),
        courseName: "Drone Training Program",
        userEmail: email || user.email,
      },
      receipt_email: email || user.email,
      description: `Drone Training Program - ${user.firstName} ${user.lastName}`,
      statement_descriptor: "DRONE TRAINING",
      statement_descriptor_suffix: "MYDRONEFORCE",
    });

    // Save payment record
    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        userId: userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: COURSE_PRICE_CENTS,
        status: "pending",
        customerEmail: email || user.email,
        customerName: `${user.firstName} ${user.lastName}`,
        metadata: {
          userEmail: email || user.email,
          userName: `${user.firstName} ${user.lastName}`,
        },
      },
      { upsert: true },
    );

    // Update user with payment intent ID
    user.stripePaymentIntentId = paymentIntent.id;
    user.paymentStatus = "pending";
    await user.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: COURSE_PRICE_DOLLARS,
      currency: "usd",
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment intent",
    });
  }
};

/**
 * @desc    Confirm payment after Stripe success
 * @route   POST /api/payment/confirm
 * @access  Public
 */
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, userId } = req.body;

    if (!paymentIntentId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID and user ID are required",
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update payment record
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
          status: "succeeded",
          paidAt: new Date(),
          receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || "",
          paymentMethodType: paymentIntent.payment_method_types?.[0] || "card",
        },
      );

      // Update user
      const user = await User.findById(userId);
      if (user) {
        user.paymentStatus = "completed";
        user.paymentCompletedAt = new Date();
        user.paymentAmount = COURSE_PRICE_DOLLARS;
        // Move to step 3 (pledge) - NOT step 4, because pledge is step 3 in your flow
        // But in your flow, after payment they go to pledge (which is Step 3 in Register.jsx)
        // Your Register.jsx has: Step 1, Step 2, Payment (new), Step 3 (Pledge)
        user.registrationStatus = "step3_pledge_pending";
        user.currentStep = 3;
        await user.save();

        // Send payment confirmation email with resume link
        await sendPaymentConfirmationEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          COURSE_PRICE_DOLLARS,
          user._id.toString(),
        );
      }

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        canProceedToStep: 3, // Step 3 is the Pledge step
      });
    } else {
      res.json({
        success: false,
        message: `Payment status: ${paymentIntent.status}`,
        canProceedToStep: null,
      });
    }
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm payment",
    });
  }
};

/**
 * @desc    Get payment status for a user
 * @route   GET /api/payment/status/:userId
 * @access  Public
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const payment = await Payment.findOne({ userId: userId });

    res.json({
      success: true,
      data: {
        paymentStatus: user.paymentStatus,
        paymentCompleted: user.paymentStatus === "completed",
        paymentAmount: user.paymentAmount,
        paymentCompletedAt: user.paymentCompletedAt,
        stripePaymentIntentId: user.stripePaymentIntentId,
        receiptUrl: payment?.receiptUrl || null,
        registrationStatus: user.registrationStatus,
        currentStep: user.currentStep,
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Stripe Webhook Handler
 * @route   POST /api/webhooks/stripe
 * @access  Public (verified by signature)
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("✅ PaymentIntent succeeded:", paymentIntent.id);

      const userId = paymentIntent.metadata.userId;

      if (userId) {
        // Update payment record
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          {
            status: "succeeded",
            paidAt: new Date(),
            receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || "",
          },
        );

        // Update user if not already updated
        const user = await User.findById(userId);
        if (user && user.paymentStatus !== "completed") {
          user.paymentStatus = "completed";
          user.paymentCompletedAt = new Date();
          user.paymentAmount = COURSE_PRICE_DOLLARS;
          user.registrationStatus = "step3_pledge_pending";
          user.currentStep = 3;
          await user.save();

          // Send payment confirmation email
          await sendPaymentConfirmationEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            COURSE_PRICE_DOLLARS,
            user._id.toString(),
          );
        }
      }
      break;

    case "payment_intent.payment_failed":
      console.log("❌ Payment failed:", event.data.object.id);
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: event.data.object.id },
        { status: "failed" },
      );
      break;

    case "charge.refunded":
      const charge = event.data.object;
      console.log("🔄 Payment refunded:", charge.id);
      // Find payment by charge ID and update status
      // This requires storing charge ID in your payment record
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  handleStripeWebhook,
};
