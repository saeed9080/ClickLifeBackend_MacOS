const query = require("../config/db");

const getAllStatements = async (req, res) => {
  try {
    const { limit = 10, offset = 0, username } = req.query;
    const result = await query(
      `SELECT * FROM statement_imp LIMIT ${limit} OFFSET ${offset}`
    );
    const totalstatements = await query("SELECT * FROM statement_imp");
    const statementresults = await query(
      `SELECT * FROM statement_imp
WHERE company = ?
   OR company IN (
     SELECT trade_name
     FROM client
     WHERE Namee = ?
   );
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

module.exports = {
  getAllStatements,
  searchController,
};
