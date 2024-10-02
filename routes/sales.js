const express = require("express");
const { getAllSales, searchController } = require("../controllers/salesController");

// express router
const router = express.Router();
// get-all-sales
router.get("/get-all-sales" ,getAllSales);
//search
router.post("/search",  searchController );

module.exports = router;
