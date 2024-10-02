const query = require("../config/db");
const vehiclesGeneratePdf = require("../GeneratedPDF/vehiclesGeneratePdf");
const allVehiclesGeneratePdf = require("../GeneratedPDF/allVehiclesGeneratePdf");


// get all vehicles

const getAllVehicles = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const vehiclesresults = await query('SELECT * FROM vehicle');
        const result = await query(`SELECT DISTINCT v.*, d.device_type FROM vehicle v LEFT JOIN devices d ON v.IMEI = d.IMEI LIMIT ${limit} OFFSET ${offset}`);
        res.status(200).send({ 
            success: true,
            result,
            vehiclesresults,
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message,
        })
    }
}

// get client data
const getClientData = async (req, res) => {
    try {
        const results = await query("SELECT Namee FROM client");
        res.status(200).json({
            success: true,
            message: "Get Client Data Successfully!",
            result: results
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        })
    }
};

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

const generateVehiclesPDFController = async (req, res) => {
    try {
        const {data, username} = req.body
        const pdfBuffer = await vehiclesGeneratePdf(data, username);
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


const generateAllVehiclesPDFController = async (req, res) => {
    try {
        const {data, username} = req.body
        const pdfBuffer = await allVehiclesGeneratePdf(data, username);
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

// unPaidVehicles

const unPaidVehiclesController = async (req, res) => {
    try {
        const {username} = req.body;
        const result = await query(`SELECT COUNT(*) FROM vehicle WHERE Expiry_Datee < CURDATE() AND Client = ?`, [username]);
        res.status(200).send({
            success: true,
            message: "All unpaid vehicles!",
            result,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

// paidVehicles

const paidVehiclesController = async (req, res) => {
    try {
        const {username} = req.body;
        const result = await query(`SELECT COUNT(*) FROM vehicle WHERE Expiry_Datee > CURDATE() AND Client = ?`, [username]);
        res.status(200).send({
            success: true,
            message: "All paid vehicles!",
            result,
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
    getClientData,
    searchController,
    generateVehiclesPDFController,
    generateAllVehiclesPDFController,
    unPaidVehiclesController,
    paidVehiclesController,
 
}