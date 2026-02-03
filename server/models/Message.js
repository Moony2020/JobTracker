const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'replied', 'closed'],
    default: 'open'
  },
  adminReply: {
    type: String
  },
  repliedAt: {
    type: Date
  },
  replies: [{
    body: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  meta: {
    ip: String,
    userAgent: String,
    pageUrl: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
