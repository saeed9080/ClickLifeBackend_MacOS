const express = require("express");
const {
  getAllStatements,
  searchController,
} = require("../controllers/statementsController");

// express router
const router = express.Router();
// get-all-statements
router.get("/get-all-statements", getAllStatements);
//search
router.post("/search", searchController);

module.exports = router;
