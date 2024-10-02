const express = require("express");
const { getAllVehicles, getClientData, searchController, generateVehiclesPDFController, generateAllVehiclesPDFController, unPaidVehiclesController, paidVehiclesController } = require("../controllers/financeController");

// express router
const router = express.Router();
// get-all-vehicles
router.get("/get-all-vehicles" ,getAllVehicles);
// get-client-data
router.post("/get-client-data",  getClientData );
//search
router.post("/search",  searchController );
//generate-vehicles-pdf
router.post("/generate-vehicles-pdf",  generateVehiclesPDFController );
//generate-allvehicles-pdf
router.post("/generate-allvehicles-pdf",  generateAllVehiclesPDFController );
//generate-allvehicles-pdf
router.post("/unpaid-vehicles",  unPaidVehiclesController );
//generate-allvehicles-pdf
router.post("/paid-vehicles",  paidVehiclesController );

module.exports = router;
