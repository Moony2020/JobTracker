const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists with this email' 
            });
        }

        // Create user
        const user = new User({ name, email, password });
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error during registration' 
        });
    }
});

// Login
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                message: 'Wrong email or password' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ 
                message: 'Wrong email or password' 
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login' 
        });
    }
});

// Get current user (Guest-friendly check)
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            return res.json(null); // Return null for guests, avoids 401 noise
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.json(null);
        }
        
        res.json(user);
    } catch (error) {
        // If token is invalid or expired, still return null
        res.json(null);
    }
});

// Logout (clear cookie)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Forgot Password (Token Generation)
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No user found with this email' });
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/#reset/${token}`;

        // ALWAYS log to console for development/testing
        console.log('--- PASSWORD RESET SYSTEM ---');
        console.log(`Email: ${user.email}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('------------------------------');

        // Send real email using Nodemailer
        try {
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
                from: `"JobTracker" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'JobTracker - Password Reset Request',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                        <h2 style="color: #6366f1; margin-top: 0;">Password Reset Request</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">You are receiving this email because you requested to reset your password for your JobTracker account.</p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Please click the button below to set a new password. This link is valid for 1 hour.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/#reset/${token}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s ease;">Reset My Password</a>
                        </div>
                        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <div style="text-align: center; color: #94a3b8; font-size: 12px; font-family: sans-serif;">
                            <p style="margin-bottom: 5px;">Best regards,</p>
                            <p style="font-weight: 600; color: #64748b; margin-top: 0;">JobTracker Team</p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.json({ message: 'Password reset instructions have been sent to your email.' });
        } catch (mailError) {
            console.error('Nodemailer Error:', mailError.message);
            // Even if email fails, we return a 200 but notify the user it's in the console for dev
            res.status(200).json({ 
                message: 'Reset link generated! (Email failed to send, please check server terminal for the link).',
                devNote: 'Email delivery failed. Check your terminal for the reset URL.'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// Change Password (while logged in)
router.post('/change-password', auth, [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Set new password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password (Final Step)
router.post('/reset-password/:token', [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { password } = req.body;
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Success! Your password has been changed.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

module.exports = router;
