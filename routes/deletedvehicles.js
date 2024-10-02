const express = require("express");
const { getAllDeletedVehicles, searchController, generateDeletedVehiclesPDFController,  } = require("../controllers/deletedVehiclesController");

// express router
const router = express.Router();
// get-all-deleted-vehicles
router.get("/get-all-deleted-vehicles" ,getAllDeletedVehicles);
//search
router.post("/search",  searchController );
//generate-deleted-vehicles-pdf
router.post("/generate-deleted-vehicles-pdf",  generateDeletedVehiclesPDFController );

module.exports = router;
