const { z } = require('zod');

// --- Application Schemas ---
const ApplicationSchema = z.object({
  jobTitle: z.string().trim().min(1, 'Job title is required').max(100, 'Job title too long'),
  company: z.string().trim().min(1, 'Company name is required').max(100, 'Company name too long'),
  location: z.string().trim().max(100, 'Location too long').optional().or(z.literal('')),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // Support ISO strings or YYYY-MM-DD
  status: z.enum(['applied', 'interview', 'test', 'offer', 'rejected', 'canceled'], {
    errorMap: () => ({ message: 'Invalid status' })
  }),
  notes: z.string().trim().max(500, 'Notes too long').optional().or(z.literal('')),
  jobLink: z.string().trim().url('Invalid URL').optional().or(z.literal('')),
  expectedSalary: z.string().trim().optional().or(z.literal('')),
  offeredSalary: z.string().trim().optional().or(z.literal('')),
  recruiterName: z.string().trim().optional().or(z.literal('')),
  recruiterEmail: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  recruiterLinkedIn: z.string().trim().optional().or(z.literal('')),
});

// --- Auth Schemas ---
const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const ResetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
});

// --- Profile Schemas ---
const ProfileSchema = z.object({
  profile: z.string().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
});

module.exports = {
  ApplicationSchema,
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  ResetPasswordSchema,
  ForgotPasswordSchema,
  ProfileSchema
};
