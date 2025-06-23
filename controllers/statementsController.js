const query = require("../config/db");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const getAllStatements = async (req, res) => {
  try {
    const { limit = 10, offset = 0, username } = req.query;
    const result = await query(
      `SELECT * FROM statement_imp ORDER BY imp_date DESC LIMIT ${limit} OFFSET ${offset}`
    );
    const totalstatements = await query("SELECT * FROM statement_imp");
    const statementresults = await query(
      `SELECT * FROM statement_imp
WHERE company = ?
   OR company IN (
     SELECT trade_name
     FROM client
     WHERE Namee = ?
   ) ORDER BY imp_date DESC;
`,
      [username, username]
    );
    const balanceQuery = `SELECT inv_amount FROM statement_imp WHERE company = ? OR company = ( SELECT trade_name FROM client WHERE Namee = ?)`;
    const balanceResult = await query(balanceQuery, [username, username]);
    res.status(200).send({
      success: true,
      result,
      totalstatements: totalstatements.length,
      statementresults,
      balanceResult:
        balanceResult.length > 0 ? balanceResult[0].inv_amount : null,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};

// searchController

const searchController = async (req, res) => {
  try {
    const { name, company } = req.body;

    let sql = `SELECT * FROM statement_imp WHERE name LIKE '%${name}%' OR company LIKE '%${company}%'`;

    const results = await query(sql);
    res.status(200).json({
      success: true,
      message: "Search results",
      total_invoices_length: results.length,
      result: results,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const generateStatementPDFController = async (req, res) => {
  try {
    const { file_url, company } = req.body;

    // 1. Lookup client's country
    const countryRows = await query(
      `SELECT country FROM client WHERE Namee = ? OR trade_name = ? LIMIT 1`,
      [company, company]
    );
    const country = countryRows.length ? countryRows[0].country : "default";
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Country not found for the specified company.",
      });
    }
    console.log(`Found country: ${country}`);

    // 2. Fetch original PDF bytes
    const { data: existingPdfBytes } = await axios.get(file_url, {
      responseType: "arraybuffer",
    });

    // 3. Load PDF from bytes, not URL
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 4a. Embed the company logo
    const logoPath = path.join(__dirname, "../assets/clicklife_logo.png");
    const logoImage = await pdfDoc.embedPng(fs.readFileSync(logoPath));

    // 4b. Embed the country-stamp and signature
    const stampPath = path.join(__dirname, `../assets/${country}.png`);
    const signaturePath = path.join(__dirname, "../assets/signature.png");
    const stampImage = await pdfDoc.embedPng(fs.readFileSync(stampPath));
    const signatureImage = await pdfDoc.embedPng(
      fs.readFileSync(signaturePath)
    );

    // 5. Draw images on pages
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height: pageH } = firstPage.getSize();
    // Logo top-left
    firstPage.drawImage(logoImage, {
      x: 20,
      y: pageH - 70 - 20,
      width: 130,
      height: 100,
    });

    const lastPage = pages[pages.length - 1];
    const { width: pageWidth } = lastPage.getSize();

    // Dimensions
    const stampWidth = 120;
    const stampHeight = 120;
    const signatureWidth = 60;
    const signatureHeight = 60;

    const bottomMargin = 40; // distance from bottom edge
    const rightMargin = 20; // distance from right edge

    const stampX = pageWidth - stampWidth - signatureWidth - rightMargin;
    const stampY = bottomMargin;

    const signatureX = stampX + stampWidth;
    const signatureY = bottomMargin;

    // Draw stamp
    lastPage.drawImage(stampImage, {
      x: stampX,
      y: stampY,
      width: stampWidth,
      height: stampHeight,
    });

    // Draw signature next to stamp (right side)
    lastPage.drawImage(signatureImage, {
      x: signatureX,
      y: signatureY,
      width: signatureWidth,
      height: signatureHeight,
    });

    // 6. Serialize and return
    const modifiedPdfBytes = await pdfDoc.save();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=statement_${Date.now()}.pdf`,
    });
    return res.send(Buffer.from(modifiedPdfBytes));
  } catch (err) {
    console.error("Error generating stamped PDF:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllStatements,
  searchController,
  generateStatementPDFController,
};
