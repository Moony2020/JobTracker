const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://jobtracker-ptwj.onrender.com", "http://localhost:3000", "http://localhost:5174", "http://localhost:5173"],
    credentials: true,
  })
);

// Stripe Webhook MUST come before express.json() to maintain raw body for signature verification
app.post("/api/payment/stripe/webhook", express.raw({ type: "application/json" }), require("./routes/payment_webhook"));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

// Routes - Make sure these are properly mounted
app.use("/api/auth", require("./routes/auth"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/interview", require("./routes/interview"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/cv", require("./routes/cv"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/admin", require("./routes/admin"));

// Serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend: https://jobtracker-ptwj.onrender.com`);
    console.log(`API: https://jobtracker-ptwj.onrender.com/api`);
  });
}

module.exports = app;
