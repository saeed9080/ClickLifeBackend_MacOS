const express = require("express");
const {
  get_cst_outController,
} = require("../controllers/get-cst-outController");

// express router
const router = express.Router();
// get-cst-out
router.post("/get-cst-out", get_cst_outController);

module.exports = router;
