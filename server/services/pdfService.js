const puppeteer = require("puppeteer");
const path = require("path");

const generatePDF = async (cvId, userId, templateKey, token) => {
  let browser;
  console.log(`[PDF] Starting generation for CV: ${cvId}`);
  try {
    // Stability args for Windows environments
    browser = await puppeteer.launch({
      headless: true, 
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none"
      ]
    });
    
    const page = await browser.newPage();
    
    // Log console messages from the page for better remote debugging
    page.on('console', msg => console.log('[PAGE CONSOLE]', msg.text()));
    page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

    // Use 127.0.0.1 for faster/more reliable resolution than 'localhost'
    const clientUrl = process.env.CLIENT_URL || "http://127.0.0.1:5173";
    
    // Fetch CV to get latest settings for query params
    const CVDocument = require("../models/CVDocument");
    const cv = await CVDocument.findById(cvId);
    const colorHex = cv?.settings?.themeColor?.replace('#', '') || '2563eb';
    const fontName = cv?.settings?.font || 'Inter';
    
    const printUrl = `${clientUrl}/cv-builder/print/${cvId}?token=${token}&template=${templateKey}&color=${colorHex}&font=${fontName}`;
    
    console.log(`[PDF] Puppeteer visiting: ${printUrl}`);

    if (token) {
      console.log(`[PDF] Setting session cookie`);
      await page.setCookie({
        name: "token",
        value: token,
        url: clientUrl,
        path: "/",
        httpOnly: true,
        secure: false, 
        sameSite: "Lax"
      });
    }

    // Set A4 viewport before navigation for stable media query triggering
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    
    // Navigate and wait for full network idle to ensure fonts/styles load
    console.log(`[PDF] Navigating to: ${printUrl}`);
    await page.goto(printUrl, {
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 60000
    });
    
    console.log(`[PDF] Page navigation finished, checking for error markers...`);

    // Check if the page itself rendered an error (optional but helpful)
    const hasError = await page.evaluate(() => document.body.innerText.includes('Error loading CV'));
    if (hasError) {
      console.error(`[PDF ERROR] Page content contains error message!`);
    }

    // Explicitly wait for the template hook we added
    try {
      console.log(`[PDF] Waiting for .resume-template selector...`);
      await page.waitForSelector('.resume-template', { timeout: 20000 });
      console.log(`[PDF] Template detected, waiting for final layout stabilization...`);
      await new Promise(r => setTimeout(r, 1500)); // Increased for Windows stability
    } catch (e) {
      console.error(`[PDF ERROR] Template .resume-template never appeared!`);
      // If it fails, let's take a look at the HTML content for debugging
      const content = await page.content();
      console.log(`[PDF DEBUG] Page content snippet: ${content.substring(0, 500)}...`);
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      }
    });

    console.log(`[PDF] Success! Generated ${pdfBuffer.length} bytes`);

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    console.error(`[PDF CRITICAL ERROR]`, err);
    if (browser) {
      try { await browser.close(); } catch(e) {}
    }
    throw err;
  }
};

module.exports = { generatePDF };
