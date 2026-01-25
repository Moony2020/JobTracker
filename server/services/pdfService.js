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
    const printUrl = `${clientUrl}/cv-builder/print/${cvId}`;
    
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

    // High viewport for initial render
    await page.setViewport({ width: 1200, height: 1600 });

    // Navigate and wait for content
    await page.goto(printUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    
    console.log(`[PDF] Page navigation finished, waiting for template...`);

    // Explicitly wait for the template hook we added
    try {
      await page.waitForSelector('.resume-template', { timeout: 20000 });
      console.log(`[PDF] Template detected, waiting for final font/style settle...`);
      // Short delay for final layout stabilization
      await new Promise(r => setTimeout(r, 2000)); 
    } catch (e) {
      console.error(`[PDF ERROR] Template .resume-template never appeared!`);
      // Take a screenshot of the failure for logs (optional but helpful)
      // await page.screenshot({ path: 'export-failure.png' });
    }

    // Ensure we are at A4 A-size before snapping
    await page.setViewport({ width: 794, height: 1123 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
      preferCSSPageSize: true
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
