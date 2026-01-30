const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Purchase = require("../models/Purchase");
const CVDocument = require("../models/CVDocument");
const Template = require("../models/Template");

module.exports = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[Webhook Error] ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(`[Webhook] Session completed: ${session.id}`);
    
    try {
        const template = await Template.findById(session.metadata.templateId);
        
        let expiresAt = null;
        if (template && template.category === "Pro") {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
        }

        const purchase = new Purchase({
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
        console.log(`[Webhook] Purchase created for user ${session.metadata.userId}`);
        
        await CVDocument.findByIdAndUpdate(session.metadata.cvId, {
          $set: { lastDownloaded: new Date() }
        });
    } catch (dbErr) {
        console.error(`[Webhook DB Error] ${dbErr.message}`);
    }
  }

  res.json({ received: true });
};
