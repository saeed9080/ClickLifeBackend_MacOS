const express = require("express");
const { getAllNotifications } = require("../controllers/notificationController");

// express router
const router = express.Router();
// get-all-notifications
router.get("/get-all-notifications" ,getAllNotifications);

module.exports = router;
