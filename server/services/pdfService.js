const puppeteer = require("puppeteer");
const path = require("path");

const generatePDF = async (cvId, userId, templateKey) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Navigate to a special print-view route on the frontend
    // We pass the token for authentication in the URL or via cookies
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5174";
    const printUrl = `${baseUrl}/cv-builder/print/${cvId}`;

    await page.goto(printUrl, {
      waitUntil: "networkidle0",
    });

    // Set A4 viewport
    await page.setViewport({ width: 794, height: 1123 }); // A4 at 96 DPI

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    if (browser) await browser.close();
    throw err;
  }
};

module.exports = { generatePDF };
