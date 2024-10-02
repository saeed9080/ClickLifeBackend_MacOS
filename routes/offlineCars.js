const express = require("express");
const { getAllVehicles, searchController, generateOfflineCarsPDFController } = require("../controllers/offlineCarsController");

// express router
const router = express.Router();
// get-all-vehicles
router.get("/get-all-vehicles" ,getAllVehicles);
//search
router.post("/search",  searchController );
//offline-cars-pdf
router.post("/offline-cars-pdf",  generateOfflineCarsPDFController );

module.exports = router;
