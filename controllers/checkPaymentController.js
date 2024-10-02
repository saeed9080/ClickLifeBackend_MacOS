const query = require("../config/db")
const checkPaymentsGeneratePdf = require('../GeneratedPDF/checkPaymentsGeneratePdf');

// get all payments

const getAllPayments = async (req, res) => {
    try {
        const { limit = 10, offset = 0 , username} = req.query;
        const statementresults = await query('SELECT * FROM statement');
        const result = await query(`SELECT * FROM statement LIMIT ${limit} OFFSET ${offset}`)
        const balanceQuery = `SELECT balance FROM statement WHERE client = ? ORDER BY date DESC,id DESC LIMIT 1`;
        const balanceResult = await query(balanceQuery, [username]);
        res.status(200).send({
            success: true,
            result,
            statementresults,
            latestBalance: balanceResult.length > 0 ? balanceResult[0].balance : null
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message,
        })
    }
}

// searchController 

const searchController = async (req, res) => {
    try {
        const { client, ref_no , loginType} = req.body;

        let sql;
        if (loginType === 'client') {
            sql = `SELECT * FROM statement WHERE ref_no LIKE '%${ref_no}%'`;
        } else {
            sql = `SELECT * FROM statement WHERE client LIKE '%${client}%' OR ref_no LIKE '%${ref_no}%'`;
        }

        const results = await query(sql);
        res.status(200).json({
            success: true,
            message: "Search results",
            total_length: results.length,
            result: results
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

const checkPaymentsPDFController = async (req, res) => {
    try {
        const {data, username} = req.body
        const pdfBuffer = await checkPaymentsGeneratePdf(data, username);
        const pdfBase64 = pdfBuffer.toString('base64'); // Convert buffer to base64

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
    getAllPayments,
    searchController,
    checkPaymentsPDFController
}