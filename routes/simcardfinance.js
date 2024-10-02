const express = require("express");
const { searchController, getAllSimCardFinance,  } = require("../controllers/simcardfinanceController");

// express router
const router = express.Router();
// get-all-simcardfinance
router.get("/get-all-simcardfinance" ,getAllSimCardFinance);
//search
router.post("/search",  searchController );

module.exports = router;
