const express = require("express");
const { getAllOrders, createOrder, getClientData, updateOrder, deleteOrder, pickOrder, markOrder, feedbackController, currentMonthCompletedOrders, orderNotification } = require("../controllers/orderController");

// express router
const router = express.Router();
// get-all-orders
router.get("/get-all-orders", getAllOrders);
// get-client-data
router.post("/get-client-data",  getClientData );
// create-order
router.post("/create-order/:userId", createOrder);
// update-order
router.put("/update-order/:orderId", updateOrder);
// delete-order
router.delete("/delete-order/:orderId", deleteOrder)
// pick-order
router.put("/pick-order/:orderId", pickOrder);
// mark-order
router.put("/mark-order/:orderId", markOrder);
// feedback
router.put("/feedback/:orderId", feedbackController);
// complete-orders
router.post("/complete-orders", currentMonthCompletedOrders);
// order-notification
router.post("/order-notification", orderNotification);

module.exports = router;
