const express = require("express");
const {
  getAllStatements,
  searchController,
  generateStatementPDFController,
} = require("../controllers/statementsController");

// express router
const router = express.Router();
// get-all-statements
router.get("/get-all-statements", getAllStatements);
//search
router.post("/search", searchController);
// generate-pdf
router.post("/generate-pdf", generateStatementPDFController);

module.exports = router;
