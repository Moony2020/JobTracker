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
    const cv = await CVDocument.findById(cvId);
    
    if (!template) return res.status(404).json({ msg: "Template not found" });

    // Clean up template name (remove placeholder names like "Executive (Maria)")
    const cleanTemplateName = template.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    const userName = cv?.data?.personal?.firstName || 'User';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Premium CV Export - ${cleanTemplateName} (${userName})`,
            },
            unit_amount: Math.round(template.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/cv-builder/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/cv-builder/cancel`,
      metadata: {
        userId: req.user.id,
        cvId,
        templateId,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/payment/stripe/webhook
// @desc    Stripe webhook - MOVED TO server.js for raw body support
// router.post("/stripe/webhook", ...) 
// HANDLED BY payment_webhook.js via server.js mount point.

// @route   GET api/payment/stripe/session/:id
// @desc    Get Stripe session details for verification + Synchronous Fulfillment fallback
// @access  Public (Session ID serves as token)
router.get("/stripe/session/:id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    
    // Check if we already have the purchase recorded
    let purchase = await Purchase.findOne({ paymentId: session.id });
    
    // SYNC FULFILLMENT FALLBACK:
    // If Stripe says it's paid but our DB is behind (webhook lag), fulfill now!
    if (!purchase && session.payment_status === 'paid') {
        console.log(`[Sync Fulfillment] Fulfilling session ${session.id} during redirect`);
        const template = await Template.findById(session.metadata.templateId);
        
        let expiresAt = null;
        if (template && template.category === "Pro") {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
        }

        purchase = new Purchase({
          user: session.metadata.userId,
          cvDocument: session.metadata.cvId,
          template: session.metadata.templateId,
          amount: session.amount_total / 100,
          provider: "stripe",
          paymentId: session.id,
          status: "completed",
          expiresAt: expiresAt
        });

        await purchase.save();
        
        await CVDocument.findByIdAndUpdate(session.metadata.cvId, {
          $set: { lastDownloaded: new Date() }
        });
    }

    const cv = await CVDocument.findById(session.metadata.cvId);

    res.json({
      cvId: session.metadata.cvId,
      cvTitle: cv?.title || "Your CV",
      status: session.payment_status,
      isFulfilled: !!purchase,
      customer_email: session.customer_details?.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
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

// @route   POST api/payment/paypal/capture-order
// @desc    Capture PayPal order and create purchase record
// @access  Private
router.post("/paypal/capture-order", auth, async (req, res) => {
  const { orderId } = req.body;

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    
    if (capture.result.status === "COMPLETED") {
      const customData = JSON.parse(capture.result.purchase_units[0].custom_id);
      const { userId, cvId, templateId } = customData;

      const template = await Template.findById(templateId);
      
      let expiresAt = null;
      if (template && template.category === "Pro") {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
      }

      const purchase = new Purchase({
        user: userId,
        cvDocument: cvId,
        template: templateId,
        amount: parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value),
        provider: "paypal",
        paymentId: orderId,
        status: "completed",
        expiresAt: expiresAt
      });

      await purchase.save();

      await CVDocument.findByIdAndUpdate(cvId, {
        $set: { lastDownloaded: new Date() }
      });

      res.json({ status: "success", purchaseId: purchase._id });
    } else {
      res.status(400).json({ msg: "Payment not completed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/payment/stripe/session/:id
// @desc    Get Stripe session details for verification + Synchronous Fulfillment fallback
// @access  Public (Session ID serves as token)
router.get("/stripe/session/:id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    
    // Check if we already have the purchase recorded
    let purchase = await Purchase.findOne({ paymentId: session.id });
    
    // SYNC FULFILLMENT FALLBACK:
    // If Stripe says it's paid but our DB is behind (webhook lag), fulfill now!
    if (!purchase && session.payment_status === 'paid') {
        console.log(`[Sync Fulfillment] Fulfilling session ${session.id} during redirect`);
        const template = await Template.findById(session.metadata.templateId);
        
        let expiresAt = null;
        if (template && template.category === "Pro") {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
        }

        purchase = new Purchase({
          user: session.metadata.userId,
          cvDocument: session.metadata.cvId,
          template: session.metadata.templateId,
          amount: session.amount_total / 100,
          provider: "stripe",
          paymentId: session.id,
          status: "completed",
          expiresAt: expiresAt
        });

        await purchase.save();
        
        await CVDocument.findByIdAndUpdate(session.metadata.cvId, {
          $set: { lastDownloaded: new Date() }
        });
    }

    const cv = await CVDocument.findById(session.metadata.cvId);

    res.json({
      cvId: session.metadata.cvId,
      cvTitle: cv?.title || "Your CV",
      status: session.payment_status,
      isFulfilled: !!purchase,
      customer_email: session.customer_details?.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
