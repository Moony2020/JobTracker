const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const paypal = require("@paypal/checkout-server-sdk");
const auth = require("../middleware/auth");
const Purchase = require("../models/Purchase");
const CVDocument = require("../models/CVDocument");
const Template = require("../models/Template");

// PayPal Setup
let environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
);
let client = new paypal.core.PayPalHttpClient(environment);

// @route   POST api/payment/stripe/create-session
// @desc    Create Stripe Checkout session for CV download
// @access  Private
router.post("/stripe/create-session", auth, async (req, res) => {
  const { cvId, templateId } = req.body;

  try {
    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ msg: "Template not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Premium CV Export - ${template.name}`,
            },
            unit_amount: Math.round(template.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL || "http://localhost:5174"}/cv-builder/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5174"}/cv-builder/cancel`,
      metadata: {
        userId: req.user.id,
        cvId,
        templateId,
      },
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/payment/stripe/webhook
// @desc    Stripe webhook to handle payment success
// @access  Public
router.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    
    // Create purchase record
    const purchase = new Purchase({
      user: session.metadata.userId,
      cvDocument: session.metadata.cvId,
      template: session.metadata.templateId,
      amount: session.amount_total / 100,
      provider: "stripe",
      paymentId: session.id,
      status: "completed",
    });

    await purchase.save();
    
    // Update CV document last downloaded or status
    await CVDocument.findByIdAndUpdate(session.metadata.cvId, {
      $set: { lastDownloaded: new Date() }
    });
  }

  res.json({ received: true });
});

// @route   POST api/payment/paypal/create-order
// @desc    Create PayPal order
// @access  Private
router.post("/paypal/create-order", auth, async (req, res) => {
  const { cvId, templateId } = req.body;

  try {
    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ msg: "Template not found" });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: template.price.toString()
        },
        description: `Premium CV Export - ${template.name}`,
        custom_id: JSON.stringify({ userId: req.user.id, cvId, templateId })
      }]
    });

    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
