const express = require("express");
const {
  getAllReceipts,
  searchController,
} = require("../controllers/receiptsController");

// express router
const router = express.Router();
// get-all-receipts
router.get("/get-all-receipts", getAllReceipts);
//search
router.post("/search", searchController);

module.exports = router;
