const query = require("../config/db")
const offlineCarsGeneratePdf = require('../GeneratedPDF/offlineCarsGeneratePdf');
// get all vehicles

const getAllVehicles = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const offlinecarsresults = await query('SELECT * FROM vehicle');
        const result = await query(`SELECT * FROM vehicle LIMIT ${limit} OFFSET ${offset}`);
        res.status(200).send({ 
            success: true,
            result,
            offlinecarsresults
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
        const { Vehicle_Label, Client, IMEI, Sim_Number } = req.body;

        let sql = `SELECT * FROM vehicle WHERE Vehicle_Label LIKE '%${Vehicle_Label}%' OR Client LIKE '%${Client}%' OR IMEI LIKE '%${IMEI}%' OR Sim_Number LIKE '%${Sim_Number}%'`;

        const results = await query(sql);
        res.status(200).json({
            success: true,
            message: "Search results",
            total_vehicle_length: results.length,
            result: results
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

const generateOfflineCarsPDFController = async (req, res) => {
    try {
        const {data, username, loginType} = req.body
        const pdfBuffer = await offlineCarsGeneratePdf(data, username, loginType);
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
    getAllVehicles,
    searchController,
    generateOfflineCarsPDFController
}