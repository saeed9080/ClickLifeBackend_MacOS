const query = require("../config/db")

// get all vehicles

const getAllSales = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const salesresults = await query('SELECT * FROM sales');
        const result = await query(`SELECT * FROM sales LIMIT ${limit} OFFSET ${offset}`);
        res.status(200).send({ 
            success: true,
            result,
            salesresults,
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
        const { name } = req.body;

        // Search sales by name
        let sql = `SELECT * FROM sales WHERE name LIKE '%${name}%'`;
        const result = await query(sql);
        res.status(200).json({
            success: true,
            message: "Search results",
            total_length: result.length,
            result
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    getAllSales,
    searchController,
}