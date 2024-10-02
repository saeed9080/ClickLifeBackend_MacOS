const express = require("express");
const { getAllPayments, searchController, checkPaymentsPDFController } = require("../controllers/checkPaymentController");

// express router
const router = express.Router();
// get-all-payments
router.get("/get-all-payments", getAllPayments);
//search
router.post("/search", searchController);
//check-payments-pdf
router.post("/check-payments-pdf", checkPaymentsPDFController);

module.exports = router;
