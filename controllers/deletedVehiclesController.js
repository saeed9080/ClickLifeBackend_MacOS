const query = require("../config/db");
const deletedVehiclesGeneratePdf = require("../GeneratedPDF/deletedVehiclesGeneratePdf");

// get all deleted vehicles

const getAllDeletedVehicles = async (req, res) => {
  try {
    const { limit = 10, offset = 0, username } = req.query;
    const result = await query(
      `SELECT * FROM deleted_vehicle LIMIT ${limit} OFFSET ${offset}`,
    );
    const totalDeletedVehicles = await query("SELECT * FROM deleted_vehicle");
    const deletedvehiclesresults = await query(
      `SELECT * FROM deleted_vehicle WHERE Client_Name = ?`,
      [username],
    );
    res.status(200).send({
      success: true,
      result,
      totalDeletedVehicles,
      deletedvehiclesresults,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
};

// searchController

// const searchController = async (req, res) => {
//   try {
//     const { Vehicle_Number, Client_Name } = req.body;

//     let sql = `SELECT * FROM deleted_vehicle WHERE Vehicle_Number LIKE '%${Vehicle_Number}%' OR Client_Name LIKE '%${Client_Name}%'`;

//     const results = await query(sql);
//     res.status(200).json({
//       success: true,
//       message: "Search results",
//       total_vehicle_length: results.length,
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
    const { Vehicle_Number = "", loginType, username } = req.body;
    console.log(Vehicle_Number, username, loginType);
    let sql;
    let params;

    if (loginType === "client") {
      sql = `
        SELECT * FROM deleted_vehicle
        WHERE Client_Name = ?
        AND Vehicle_Number LIKE ?
      `;
      params = [username, `%${Vehicle_Number}%`];
    } else {
      sql = `
        SELECT * FROM deleted_vehicle
        WHERE Vehicle_Number LIKE ?
        OR Client_Name LIKE ?
      `;
      params = [`%${Vehicle_Number}%`, `%${Vehicle_Number}%`];
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

const generateDeletedVehiclesPDFController = async (req, res) => {
  try {
    const { data, username } = req.body;
    console.log("Pdf data: ", data.length);
    const pdfBuffer = await deletedVehiclesGeneratePdf(data, username);
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

module.exports = {
  getAllDeletedVehicles,
  searchController,
  generateDeletedVehiclesPDFController,
};
