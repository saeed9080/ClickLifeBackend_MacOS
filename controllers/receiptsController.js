const query = require("../config/db");

const getAllReceipts = async (req, res) => {
  try {
    const { limit = 10, offset = 0, username } = req.query;
    const result = await query(
      `SELECT * FROM receipt LIMIT ${limit} OFFSET ${offset}`
    );
    const totalreceipt = await query("SELECT * FROM receipt");
    const receiptresults = await query(
      `SELECT * FROM receipt
WHERE company = ?
   OR company IN (
     SELECT trade_name
     FROM client
     WHERE Namee = ?
   );
`,
      [username, username]
    );
    res.status(200).send({
      success: true,
      result,
      totalreceipt: totalreceipt.length,
      receiptresults,
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

    let sql = `SELECT * FROM receipt WHERE name LIKE '%${name}%' OR company LIKE '%${company}%'`;

    const results = await query(sql);
    res.status(200).json({
      success: true,
      message: "Search results",
      total_receipts_length: results.length,
      result: results,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const generateReceiptsPDFController = async (req, res) => {
  try {
    const { data, username } = req.body;
    const pdfBuffer = await deletedVehiclesGeneratePdf(data, username);
    const pdfBase64 = pdfBuffer.toString("base64"); // Convert buffer to base64

    res.status(200).json({
      success: true,
      message: "PDF generated successfully!",
      pdfBase64, // Send the base64 string
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllReceipts,
  searchController,
};
