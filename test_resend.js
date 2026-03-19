require('dotenv').config({ path: 'c:/Users/Mymoon Dobaibi/OneDrive - Linnéuniversitetet/Desktop/Mixed/Projects-Codes/JobTracker/.env' });
const { sendMail } = require('./server/config/mail');
const fs = require('fs');

async function testResend() {
    let log = '';
    const originalLog = console.log;
    console.log = (...args) => {
        log += args.join(' ') + '\n';
        originalLog(...args);
    };

    console.log('Testing Resend HTTP API...');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Set' : 'MISSING');
    
    try {
        const result = await sendMail({
            to: 'mymoon676@hotmail.com',
            subject: 'Test from Resend API (Logged)',
            html: '<strong>Resend is working!</strong>',
            text: 'Resend is working!'
        });
        console.log('✅ Test complete. Result:', JSON.stringify(result));
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        log += 'ERROR: ' + error.message + '\n';
    }

    fs.writeFileSync('test_resend_log.txt', log);
}

testResend();
