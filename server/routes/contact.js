const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const path = require('path');
const Message = require('../models/Message');

// POST /api/contact
router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        // 1. Save Message to Database
        const newMessage = new Message({
            name,
            email,
            subject,
            message,
            meta: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                pageUrl: req.headers.referer
            }
        });
        await newMessage.save();

        const transporter = nodemailer.createTransport({
             // Reuse existing config from auth.js
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
            from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send TO the Admin (You)
            replyTo: email, // Reply to the Visitor
            subject: `[Portfolio Contact] ${subject || 'New Message'}`,
            text: `New Contact Message\n\nFrom: ${name} (${email})\nSubject: ${subject || 'No Subject'}\n\n${message}`,
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
                                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 0; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">New Inquiry from Portfolio</h1>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 16px;">You have received a new message via your website contact form.</p>
                                            
                                            <!-- Sender Info -->
                                            <table width="100%" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td width="50%" style="padding-bottom: 20px; vertical-align: top;">
                                                        <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 5px;">From</span>
                                                        <span style="font-size: 16px; color: #1e293b; font-weight: 600;">${name}</span>
                                                    </td>
                                                    <td width="50%" style="padding-bottom: 20px; vertical-align: top;">
                                                        <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 5px;">Email Address</span>
                                                        <a href="mailto:${email}" style="font-size: 16px; color: #6366f1; text-decoration: none; font-weight: 500;">${email}</a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2">
                                                        <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 5px;">Subject</span>
                                                        <span style="font-size: 16px; color: #1e293b; font-weight: 500;">${subject || 'No Subject'}</span>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Message Box -->
                                            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 25px; border-radius: 4px;">
                                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 10px;">Message</span>
                                                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${message}</p>
                                            </div>

                                            <!-- CTA -->
                                            <div style="margin-top: 30px; text-align: center;">
                                                <a href="mailto:${email}" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 600; font-size: 14px;">Reply to ${name.split(' ')[0]}</a>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} JobTracker Portfolio</p>
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

        // 2. Auto-Reply to Visitor
        const replyOptions = {
            from: `"JobTracker Portfolio" <${process.env.EMAIL_USER}>`,
            to: email, // Send TO the Visitor
            subject: `Confirmation: Message Received - JobTracker`,
            text: `JOBTRACKER\n\nHi ${name},\n\nThank you for contacting JobTracker. I have received your message regarding "${subject || 'Inquiry'}" and will get back to you soon.\n\nYour Message:\n"${message}"\n\nBest Regards,\nMymoon Dobaibi\nJobTracker`,
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
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Thanks for reaching out!</h1>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">Hi <strong>${name}</strong>,</p>
                                            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                                                Thank you for contacting <strong>JobTracker</strong>. I have received your message regarding "<strong>${subject || 'Inquiry'}</strong>" and will get back to you as soon as possible.
                                            </p>
                                            
                                            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                                                <p style="margin: 0; font-size: 14px; color: #64748b; font-style: italic;">"${message.length > 100 ? message.substring(0, 100) + '...' : message}"</p>
                                            </div>

                                            <p style="margin: 0 0 10px 0; color: #334155; font-weight: 600;">Best Regards,</p>
                                            <p style="margin: 0; color: #6366f1; font-size: 16px; font-weight: 700;">Mymoon Dobaibi</p>
                                            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">JobTracker</p>
                                        </td>
                                    </tr>
                                    <!-- Footer with Contact Details -->
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
        await transporter.sendMail(replyOptions);
        res.json({ message: 'Message sent successfully!' });

    } catch (error) {
        console.error('Contact Email Error:', error);
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
});

module.exports = router;
