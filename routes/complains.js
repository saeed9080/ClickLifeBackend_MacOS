const express = require("express");
const { getAllComplains, getClientData, createComplain, issuesolved, updateComplain, deleteComplain } = require("../controllers/complainsController");

// express router
const router = express.Router();
// get-all-complains
router.get("/get-all-complains" ,getAllComplains);
// get-client-data
router.post("/get-client-data",  getClientData );
// create-complain
router.post("/create-complain/:userId", createComplain);
// issue-complain
router.put("/issue-complain/:complainId", issuesolved);
// update-complain
router.put("/update-complain/:complainId", updateComplain);
// delete-complain
router.delete("/delete-complain/:complainId", deleteComplain)

module.exports = router;
