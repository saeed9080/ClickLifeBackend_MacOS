const express = require("express");
const {
  getAllInvoices,
  searchController,
  generateInvoicePDFController,
} = require("../controllers/invoicesController");

// express router
const router = express.Router();
// get-all-invoices
router.get("/get-all-invoices", getAllInvoices);
//search
router.post("/search", searchController);
//generate-invoices-pdf
router.post("/generate-invoices-pdf", generateInvoicePDFController);

module.exports = router;
