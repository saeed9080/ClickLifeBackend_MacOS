const query = require("../config/db");

// get all deleted vehicles

const getAllInvoices = async (req, res) => {
  try {
    const { limit = 10, offset = 0, username } = req.query;
    const result = await query(
      `SELECT * FROM invoice_imp ORDER BY imp_date DESC LIMIT ${limit} OFFSET ${offset}`
    );
    const totalinvoice = await query("SELECT * FROM invoice_imp");
    const invoiceresults = await query(
      `SELECT * FROM invoice_imp
WHERE company = ?
   OR company IN (
     SELECT trade_name
     FROM client
     WHERE Namee = ?
   ) ORDER BY imp_date DESC;
`,
      [username, username]
    );
    res.status(200).send({
      success: true,
      result,
      totalinvoice: totalinvoice.length,
      invoiceresults,
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

    let sql = `SELECT * FROM invoice_imp WHERE name LIKE '%${name}%' OR company LIKE '%${company}%'`;

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

module.exports = {
  getAllInvoices,
  searchController,
};
