const express = require("express");
const { getAllSMSCommands, updateSMSCommands } = require("../controllers/smsCommandsController");

// express router
const router = express.Router();
// get-all-smscommands
router.get("/get-all-smscommands" ,getAllSMSCommands);
// engine-off-send-msg
router.post("/edit-smscommands/:smscommandId" ,updateSMSCommands);

module.exports = router;
