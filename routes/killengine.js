const express = require("express");
const { searchController, getAllVehicles, engineOnSendMessage, engineOffSendMessage } = require("../controllers/killEngineController");

// express router
const router = express.Router();
// get-all-vehicles
router.get("/get-all-vehicles" ,getAllVehicles);
// engine-on-send-msg
router.post("/engine-on-send-msg" ,engineOnSendMessage);
// engine-off-send-msg
router.post("/engine-off-send-msg" ,engineOffSendMessage);
//search
router.post("/search",  searchController );

module.exports = router;
