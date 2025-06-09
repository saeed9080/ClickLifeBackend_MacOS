const query = require("../config/db");
const offlineCarsGeneratePdf = require("../GeneratedPDF/offlineCarsGeneratePdf");
// get all vehicles

const getAllVehicles = async (req, res) => {
  try {
    const { limit = 10, offset = 0, username } = req.query;
    const result = await query(`
      SELECT * FROM vehicle 
      WHERE last_signal = 'Not connected'
      UNION
      SELECT * FROM vehicle 
      WHERE last_signal REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} (AM|PM)$'
      AND DATEDIFF(CURDATE(), STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p')) > 3
      LIMIT ${limit} OFFSET ${offset};
    `);
    const totalVehicles = await query(`
      SELECT * FROM vehicle 
      WHERE last_signal = 'Not connected'
      UNION
      SELECT * FROM vehicle 
      WHERE last_signal REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} (AM|PM)$'
      AND DATEDIFF(CURDATE(), STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p')) > 3
    `);
    const totalcount = await query(
      `
SELECT * FROM vehicle WHERE client = ? AND ( last_signal = 'Not connected' OR ( STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p') IS NOT NULL AND STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p') < NOW() - INTERVAL 3 DAY ) ) `,
      [username]
    );
    res.status(200).send({
      success: true,
      result,
      totalVehicles,
      totalcount,
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
    const { Vehicle_Label, Client, IMEI, Sim_Number } = req.body;

    let sql = `SELECT * FROM vehicle WHERE 
    (Vehicle_Label LIKE '%${Vehicle_Label}%' AND last_signal = 'Not connected') OR (Vehicle_Label LIKE '%${Vehicle_Label}%' AND last_signal REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} (AM|PM)$'AND DATEDIFF(CURDATE(), STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p')) > 3)
    OR 
    (Client LIKE '%${Client}%' AND last_signal = 'Not connected') OR (Client LIKE '%${Client}%' AND last_signal REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} (AM|PM)$'AND DATEDIFF(CURDATE(), STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p')) > 3)
    OR
    (IMEI LIKE '%${IMEI}%' AND last_signal = 'Not connected') OR (IMEI LIKE '%${IMEI}%' AND last_signal REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} (AM|PM)$'AND DATEDIFF(CURDATE(), STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p')) > 3)
    OR 
    (Sim_Number LIKE '%${Sim_Number}%' AND last_signal = 'Not connected') OR (Sim_Number LIKE '%${Sim_Number}%' AND last_signal REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} (AM|PM)$'AND DATEDIFF(CURDATE(), STR_TO_DATE(last_signal, '%d-%m-%Y %h:%i:%s %p')) > 3)`;

    const results = await query(sql);
    res.status(200).json({
      success: true,
      message: "Search results",
      total_vehicle_length: results.length,
      result: results,
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
    const { data, username, loginType } = req.body;
    const pdfBuffer = await offlineCarsGeneratePdf(data, username, loginType);
    // const pdfBase64 = pdfBuffer.toString('base64'); // Convert buffer to base64

    if (!pdfBuffer) {
      throw new Error("PDF generation failed");
    }

    // Validate PDF before sending it as base64
    const pdfBase64 = pdfBuffer.toString("base64");

    if (!pdfBase64) {
      throw new Error("Failed to convert PDF to base64");
    }

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
  generateOfflineCarsPDFController,
};
