const express = require("express");
const {
  getAllStatements,
  searchController,
  generateStatementPDFController,
  getClientData,
} = require("../controllers/statementsController");

// express router
const router = express.Router();
// get-all-statements
router.get("/get-all-statements", getAllStatements);
// get-client-data
router.post("/get-client-data", getClientData);
//search
// router.post("/search", searchController);
// generate-pdf
// router.post("/generate-pdf", generateStatementPDFController);

module.exports = router;
