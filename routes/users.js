const express = require("express");
const { loggedUserController, logoutController, clientLoginController, adminLoginController, staffLoginController, updateUserController } = require("../controllers/usersController");
const authenticateUser = require("../middlewares/authMiddleware");
const upload = require("./upload");

// express router
const router = express.Router();
// login
router.post("/admin-login" ,adminLoginController);
// login
router.post("/staff-login" ,staffLoginController);
// login
router.post("/client-login" ,clientLoginController);
// logged user
router.post("/logged-user", authenticateUser, loggedUserController);
// logout
router.post("/logout", logoutController);
// update-user
router.put("/update-user/:id", upload, updateUserController);

module.exports = router;

