const query = require("../config/db")
const deletedVehiclesGeneratePdf = require('../GeneratedPDF/deletedVehiclesGeneratePdf');

// get all deleted vehicles

const getAllDeletedVehicles = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const deletedvehiclesresults = await query('SELECT * FROM deleted_vehicle');
        const result = await query(`SELECT * FROM deleted_vehicle LIMIT ${limit} OFFSET ${offset}`)
        res.status(200).send({
            success: true,
            result,
            deletedvehiclesresults
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
        const { Vehicle_Number, Client_Name } = req.body;

        let sql = `SELECT * FROM deleted_vehicle WHERE Vehicle_Number LIKE '%${Vehicle_Number}%' OR Client_Name LIKE '%${Client_Name}%'`;

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

const generateDeletedVehiclesPDFController = async (req, res) => {
    try {
        const {data, username} = req.body
        const pdfBuffer = await deletedVehiclesGeneratePdf(data, username);
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
    getAllDeletedVehicles,
    searchController,
    generateDeletedVehiclesPDFController
}