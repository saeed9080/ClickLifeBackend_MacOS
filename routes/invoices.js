const express = require("express");
const {
  getAllInvoices,
  searchController,
} = require("../controllers/invoicesController");

// express router
const router = express.Router();
// get-all-invoices
router.get("/get-all-invoices", getAllInvoices);
//search
router.post("/search", searchController);

module.exports = router;
