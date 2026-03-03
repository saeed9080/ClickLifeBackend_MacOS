const query = require("../config/db");

const get_cst_outController = async (req, res) => {
  try {
    const { username, Balance } = req.body;
    if (!username) throw new Error("Invalid JSON input");

    const customer = username || "";
    let balance = parseFloat(Balance || 0);

    if (!customer) throw new Error("Customer is required");

    /* ---------------- GET OPENING BALANCE ---------------- */
    let [rows] = await query(
      "SELECT inv_amount FROM statement_imp WHERE company = ? LIMIT 1",
      [customer],
    );

    if (rows && rows.length > 0 && rows[0]?.inv_amount) {
      const clean = rows[0].inv_amount.replace(/[^\-\d\.]/g, "");
      balance = parseFloat(clean);
    }

    /* ---------------- GET TOTAL INVOICES ---------------- */
    [rows] = await query(
      `SELECT SUM(total_amount) AS total
       FROM invoice
       WHERE company = ?
       AND imp_date >= '2025-12-01'`,
      [customer],
    );
    console.log("Invoice rows:", rows);
    balance += parseFloat(rows?.total || 0);

    /* ---------------- GET TOTAL RECEIPTS ---------------- */
    [rows] = await query(
      `SELECT SUM(amount) AS total
       FROM receipt
       WHERE company = ?
       AND date >= '2025-12-01'`,
      [customer],
    );
    console.log("Receipt rows:", rows);
    balance -= parseFloat(rows?.total || 0);

    /* ---------------- GET TOTAL CREDIT NOTES ---------------- */
    [rows] = await query(
      `SELECT SUM(amount) AS total
       FROM credit_Note
       WHERE company = ?
       AND imp_date >= '2025-12-01'`,
      [customer],
    );
    console.log("Credit Note rows:", rows);
    balance -= parseFloat(rows?.total || 0);

    /* ---------------- RESULT ---------------- */
    res.json({
      status: "success",
      closing_balance: balance.toFixed(3),
    });
  } catch (err) {
    console.error(err.message);
    res.json({
      status: "error",
      message: err.message,
    });
  }
};

module.exports = {
  get_cst_outController,
};
