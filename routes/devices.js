const express = require("express");
const { searchController, getAllDevices } = require("../controllers/devicesController");

// express router
const router = express.Router();
// get-all-devices
router.get("/get-all-devices" ,getAllDevices);
//search
router.post("/search",  searchController );

module.exports = router;
