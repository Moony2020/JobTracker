process.env.NODE_ENV = 'test';
require('dotenv').config();
console.log('Env Loaded. URI exists?', !!process.env.MONGO_URI);

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Application = require('../models/Application');

// Mock external SDKs to prevent startup errors
jest.mock('groq-sdk', () => {
  return class Groq {
    constructor() { 
      this.chat = { completions: { create: jest.fn() } };
    }
  };
});
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn()
  }))
}));

// Mock Auth Middleware to bypass login
const mockMongoose = require('mongoose');
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: new mockMongoose.Types.ObjectId() };
  next();
});

jest.setTimeout(30000);

beforeAll(async () => {
    // Connect to real DB but we will be careful
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for testing');
    } catch (error) {
        console.error('DB Connection failed', error);
        throw error;
    }
});

afterAll(async () => {
    // Cleanup
    await Application.deleteMany({ company: 'Jest_Reliability_Test_Corp' });
    await mongoose.disconnect();
});

describe('Applications API', () => {
    it('should create a new job application', async () => {
        const newApp = {
            jobTitle: 'Senior Automated Tester',
            company: 'Jest_Reliability_Test_Corp',
            location: 'Remote',
            date: '2026-01-21',
            status: 'applied'
        };

        const res = await request(app)
            .post('/api/applications')
            .send(newApp);

        expect(res.statusCode).toEqual(201);
        expect(res.body.jobTitle).toEqual('Senior Automated Tester');
        expect(res.body.company).toEqual('Jest_Reliability_Test_Corp');
        
        // Verify it's actually in the database
        const savedApp = await Application.findOne({ company: 'Jest_Reliability_Test_Corp' });
        expect(savedApp).toBeTruthy();
        expect(savedApp.jobTitle).toEqual('Senior Automated Tester');
        expect(savedApp.status).toEqual('applied');
    });
});
