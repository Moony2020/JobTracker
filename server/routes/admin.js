const express = require("express");
const router = express.Router();
const User = require("../models/User");
const CVDocument = require("../models/CVDocument");
const Template = require("../models/Template");
const Purchase = require("../models/Purchase");
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');

// @route   GET api/admin/stats
// @desc    Get dashboard statistics (KPIs, Charts)
// @access  Private/Admin
router.get("/stats", auth, auth.adminOnly, async (req, res) => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // 1. KPI Cards
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: last30Days } });
    const totalCVs = await CVDocument.countDocuments();
    const paidDownloads = await Purchase.countDocuments({ status: "completed" });

    // 2. Revenue This Month (Calculated as Last 30 Days to match Dashboard Recent Payments)
    const revenueResult = await Purchase.aggregate([
      { $match: { status: "completed", createdAt: { $gte: last30Days } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const revenueThisMonth = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // 3. Recent Payments
    const recentPayments = await Purchase.find({ status: "completed" })
      .populate("user", "name email")
      .populate("template", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // 4. User Analytics (Free vs Pro Usage)
    const usageStats = await CVDocument.aggregate([
      {
        $lookup: {
          from: "templates",
          localField: "templateId",
          foreignField: "_id",
          as: "template"
        }
      },
      { $unwind: "$template" },
      {
        $group: {
          _id: "$template.category",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format usage stats for donut chart
    const formattedUsage = usageStats.map(stat => ({
      name: stat._id,
      value: stat.count,
      color: stat._id === "Free" ? "#5B7CFF" : "#8B5CFF"
    }));

    // 5. Income Insights (Last 30 days bar chart)
    const incomeInsights = await Purchase.aggregate([
      { $match: { status: "completed", createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedIncome = incomeInsights.map(item => ({
      name: item._id,
      value: item.amount
    }));

    // 6. Today's Activity (for Notifications)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todayPayments = await Purchase.countDocuments({ 
      status: "completed", 
      createdAt: { $gte: startOfToday } 
    });

    const todayUsers = await User.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    const recentMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(10);


    res.json({
      kpis: {
        totalUsers,
        activeUsers,
        totalCVs,
        paidDownloads,
        revenueThisMonth
      },
      recentPayments,
      usageAnalytics: formattedUsage,
      incomeInsights: formattedIncome,
      todayPayments,
      todayUsers,
      todayActivity: todayPayments + todayUsers, // Total for the bell icon
      recentMessages
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/admin/users
// @desc    Get all registered users
// @access  Private/Admin
router.get("/users", auth, auth.adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/admin/payments
// @desc    Get all transactions/purchases
// @access  Private/Admin
router.get("/payments", auth, auth.adminOnly, async (req, res) => {
  try {
    const payments = await Purchase.find()
      .populate("user", "name email")
      .populate("template", "name category")
      .populate("cvDocument", "title")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/admin/messages
// @desc    Get all contact messages
// @access  Private/Admin
router.get("/messages", auth, auth.adminOnly, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/admin/messages/:id/reply
// @desc    Reply to a message
// @access  Private/Admin
// @route   POST api/admin/messages/:id/reply
// @desc    Reply to a message
// @access  Private/Admin
router.post("/messages/:id/reply", auth, auth.adminOnly, async (req, res) => {
  const { replyText } = req.body;

  if (!replyText) {
    return res.status(400).json({ message: "Reply text is required" });
  }


  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // 1. Send Email
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: `"JobTracker Support" <${process.env.EMAIL_USER}>`,
        to: message.email,
        subject: `Re: ${message.subject || 'Inquiry'} - JobTracker`,
        text: `JobTracker Support Reply\n\nHi ${message.name},\n\n${replyText}\n\nBest Regards,\nJobTracker Team`,
        html: `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #1e293b; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 0; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Response from JobTracker</h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">Hi <strong>${message.name}</strong>,</p>
                                        
                                        <div style="margin-bottom: 25px;">
                                            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 700;">Our Reply</p>
                                            <div style="color: #1e293b; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${replyText.replace(/\n/g, '<br>')}</div>
                                        </div>

                                        <div style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                                            <p style="margin: 0 0 5px 0; font-size: 12px; color: #94a3b8; font-weight: 700;">IN REPLY TO YOUR MESSAGE:</p>
                                            <p style="margin: 0; font-size: 13px; color: #64748b; font-style: italic;">"${message.message.length > 150 ? message.message.substring(0, 150) + '...' : message.message}"</p>
                                        </div>

                                        <p style="margin: 0 0 10px 0; color: #334155; font-weight: 600;">Best Regards,</p>
                                        <p style="margin: 0; color: #6366f1; font-size: 16px; font-weight: 700;">JobTracker Team</p>
                                        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Support Center</p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #1e293b; padding: 30px; text-align: center;">
                                         <p style="margin: 0 0 10px 0; color: #ffffff; font-weight: 600; font-size: 14px;">Keep In Touch</p>
                                        <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 13px;">
                                            <a href="mailto:contact@jobtracker.com" style="color: #cbd5e1; text-decoration: none;">contact@jobtracker.com</a>
                                            &nbsp;|&nbsp; 
                                            <span style="color: #cbd5e1;">Sweden</span>
                                        </p>
                                        <p style="margin: 20px 0 0 0; font-size: 11px; color: #64748b;">&copy; ${new Date().getFullYear()} JobTracker. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    await transporter.sendMail(mailOptions);

    // 2. Update Database
    message.status = 'replied';
    message.repliedAt = Date.now();
    message.adminReply = replyText; // Keep latest for backward compatibility
    
    // Add to history
    message.replies.push({
      body: replyText,
      date: Date.now()
    });
    
    await message.save();

    res.json({ success: true, message: "Reply sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error: " + err.message);
  }
});

// @route   DELETE api/admin/messages/:id
// @desc    Delete a message
// @access  Private/Admin
router.delete("/messages/:id", auth, auth.adminOnly, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.deleteOne();
    res.json({ message: "Message removed" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
