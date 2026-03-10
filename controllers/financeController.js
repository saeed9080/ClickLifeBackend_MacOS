const query = require("../config/db");
const vehiclesGeneratePdf = require("../GeneratedPDF/vehiclesGeneratePdf");
const allVehiclesGeneratePdf = require("../GeneratedPDF/allVehiclesGeneratePdf");

// get all vehicles

const getAllVehicles = async (req, res) => {
  try {
    const { limit = 10, offset = 0, username } = req.query;
    const result = await query(
      `SELECT DISTINCT v.*, d.device_type FROM vehicle v LEFT JOIN devices d ON v.IMEI = d.IMEI LIMIT ${limit} OFFSET ${offset}`,
    );
    const totalVehicles = await query("SELECT * FROM vehicle");
    const vehiclesresults = await query(
      `SELECT * FROM vehicle WHERE Client = ?`,
      [username],
    );
    console.log("vehiclesresults: ", vehiclesresults.length);
    res.status(200).send({
      success: true,
      result,
      totalVehicles,
      vehiclesresults,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};

// get client data
const getClientData = async (req, res) => {
  try {
    const results = await query("SELECT Namee FROM client");
    res.status(200).json({
      success: true,
      message: "Get Client Data Successfully!",
      result: results,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// searchController

// const searchController = async (req, res) => {
//   try {
//     const { Vehicle_Label, Client } = req.body;

//     let sql = `SELECT * FROM vehicle WHERE Vehicle_Label LIKE '%${Vehicle_Label}%' OR Client LIKE '%${Client}%'`;
//     const results = await query(sql);
//     res.status(200).json({
//       success: true,
//       message: "Search results",
//       result: results,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const searchController = async (req, res) => {
  try {
    const { Vehicle_Label = "", loginType, username } = req.body;
    console.log(Vehicle_Label, username, loginType);
    let sql;
    let params;

    if (loginType === "client") {
      sql = `
        SELECT * FROM vehicle
        WHERE Client = ?
        AND Vehicle_Label LIKE ?
      `;
      params = [username, `%${Vehicle_Label}%`];
    } else {
      sql = `
        SELECT * FROM vehicle
        WHERE Vehicle_Label LIKE ?
        OR Client LIKE ?
      `;
      params = [`%${Vehicle_Label}%`, `%${Vehicle_Label}%`];
    }
    console.log("Final SQL:", sql);
    console.log("Params:", params);
    const results = await query(sql, params);
    console.log("Results:", results.length);

    res.status(200).json({
      success: true,
      message: "Search results",
      result: results,
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
    const { data, username } = req.body;
    console.log("PDF Data Length:", data.length);
    const pdfBuffer = await vehiclesGeneratePdf(data, username);
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

const path = require("path");
const fs = require("fs");
const generatePDF = require("../GeneratedPDF/allVehiclesGeneratePdf");

const generateAllVehiclesPDFController = async (req, res) => {
  try {
    const { username } = req.body;

    const vehicles = await query(`
      SELECT DISTINCT v.*, d.device_type
      FROM vehicle v
      LEFT JOIN devices d ON v.IMEI = d.IMEI
    `);

    console.log("Vehicles count:", vehicles.length);

    const pdfBuffer = await generatePDF(vehicles, username);

    const fileName = `vehicles_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "../public/pdfs", fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    const url = `${req.protocol}://${req.get("host")}/pdfs/${fileName}`;

    res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// const generateAllVehiclesPDFController = async (req, res) => {
//   try {
//     const { data, username } = req.body;
//     console.log("Pdf data: ", data.length);
//     const pdfBuffer = await allVehiclesGeneratePdf(data, username);
//     const pdfBase64 = pdfBuffer.toString("base64"); // Convert buffer to base64

//     res.status(200).json({
//       success: true,
//       message: "PDF generated successfully!",
//       pdfBase64, // Send the base64 string
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// unPaidVehicles

const unPaidVehiclesController = async (req, res) => {
  try {
    const { username } = req.body;
    const result = await query(
      `SELECT COUNT(*) FROM vehicle WHERE Expiry_Datee < CURDATE() AND Client = ?`,
      [username],
    );
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
    const { username } = req.body;
    const result = await query(
      `SELECT COUNT(*) FROM vehicle WHERE Expiry_Datee > CURDATE() AND Client = ?`,
      [username],
    );
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
};
