const express = require("express");
const router = express.Router();
const User = require("../models/User");
const CVDocument = require("../models/CVDocument");
const Template = require("../models/Template");
const Purchase = require("../models/Purchase");
const auth = require("../middleware/auth");

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
      todayActivity: todayPayments + todayUsers // Total for the bell icon
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

module.exports = router;
