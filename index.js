const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT;
const path = require("path"); // Import the path module

//rest object
const app = express();

//connect to db
require("./config/db");

//middlewares
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors()); // cors middleware to prevent errors when trying to access data from different origins
app.use(cookieParser());
// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

//routes
app.use("/api/v1/user", require("./routes/users"));
app.use("/api/v1/order", require("./routes/order"));
app.use("/api/v1/complain", require("./routes/complains"));
app.use("/api/v1/deleted_vehicles", require("./routes/deletedvehicles"));
app.use("/api/v1/vehicles", require("./routes/finance"));
app.use("/api/v1/offline_cars", require("./routes/offlineCars"));
app.use("/api/v1/devices", require("./routes/devices"));
app.use("/api/v1/sim_card_finance", require("./routes/simcardfinance"));
app.use("/api/v1/sales", require("./routes/sales"));
app.use("/api/v1/client", require("./routes/clients"));
app.use("/api/v1/check_payment", require("./routes/checkpayment"));
app.use("/api/v1/notifications", require("./routes/notifications"));
app.use("/api/v1/smscommands", require("./routes/smscommands"));
app.use("/api/v1/killengine", require("./routes/killengine"));
app.use("/api/v1/invoices", require("./routes/invoices"));
app.use("/api/v1/statements", require("./routes/statements"));
app.use("/api/v1/receipts", require("./routes/receipts"));

app.get("/", (req, res) => {
  return res.status(200).send("<h2>Welcome To Node Server</h2>");
});

// listen
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`.bgYellow.black);
});
