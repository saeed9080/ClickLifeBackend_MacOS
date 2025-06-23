const query = require("../config/db");
const admin = require("../config/firebaseService");
const axios = require("axios");

function convertTo12HourFormat(dateTime) {
  // Split the dateTime string into date and time parts
  const [datePart, timePart] = dateTime.split(" ");

  // Split the time part into hours, minutes, and seconds
  let [hours, minutes, seconds] = timePart.split(":");
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  seconds = parseInt(seconds);

  // Determine AM or PM suffix
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour format to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Format the time string in 12-hour format
  const formattedTime = `${hours}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${ampm}`;

  // Return the date part with the formatted time
  return `${datePart} ${formattedTime}`;
}

// get all orders
const getAllOrders = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const results = await query(
      `SELECT * FROM orders WHERE status = 0 ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`
    );
    const orderresults = await query(
      `SELECT * FROM orders WHERE status = 0 ORDER BY id DESC`
    );
    const latestOrder = await query(
      `SELECT * FROM orders ORDER BY id DESC LIMIT 1`
    );
    res.status(200).json({
      success: true,
      message: "Get All Orders Successfully!",
      result: results,
      orderresults,
      latestOrder,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// get client data
const getClientData = async (req, res) => {
  try {
    const results = await query("SELECT Namee, Phone, country FROM client");
    res.status(200).json({
      success: true,
      message: "Get Client Data Successfully!",
      result: results,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// create order

const createOrder = async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      loginType,
      client_for,
      secName,
      secNum,
      cars,
      phone,
      description,
      orderDate,
      Notes,
      order_time,
      country,
      username,
      orderID,
    } = req.body; // Assuming loginType is passed in the request body

    let clientName = null;

    if (loginType !== "client") {
      const userResult = await query(
        "SELECT Namee FROM Users WHERE id = ?",
        userId
      );
      if (userResult.length === 0) {
        return res.status(404).send({
          success: false,
          message: "User not found",
        });
      }
      clientName = userResult[0].Namee;
    }

    function getFormattedLocalDateTime() {
      const date = new Date();

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0"); // getMonth() is zero-based
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      return formattedDateTime;
    }

    const issue_date = getFormattedLocalDateTime(); // This will print the current date and time in yyyy-mm-dd hh:mm:ss format

    // Constructing the order object with the fetched data
    const orderData = {
      client: clientName || req.body.client,
      client_for,
      secName,
      secNum,
      cars,
      phone,
      description,
      orderDate,
      Notes,
      issue_date: issue_date, // Automatically generated issue_date
      order_time,
      country,
    };

    // Inserting the order into the orders table
    const result = await query("INSERT INTO orders SET ?", orderData);

    // Fetch device tokens for users
    const userTokensResult = await query(
      `
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department != 'Technician') 
            UNION 
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department = 'Technician' AND country = ?) 
            UNION 
            (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
      [country, client_for]
    );
    //(SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department != 'Technician') UNION (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department = 'Technician' AND country = ?) UNION (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?);
    if (userTokensResult.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No users found in the specified id",
      });
    }

    // Extract device tokens from the result
    // const deviceTokens = userTokensResult.map(user => user.device_token);
    const deviceTokens = userTokensResult
      .map((user) => user.device_token)
      .filter((token) => token);

    // Send push notification
    const message = {
      notification: {
        title: "Order Created",
        body: `${username} Created Order for ${orderData.client_for}.`,
      },
      tokens: deviceTokens,
    };

    const messageTitle = message.notification.title;
    const messageBody = message.notification.body;
    // Get current date and time in local time zone
    const date = new Date();
    const datePart = date.toISOString().split("T")[0];
    const timePart = date.toLocaleTimeString("en-US", {
      hour12: false,
    });
    const messageTime = `${datePart} ${timePart}`;
    const timeIn12HourFormat = convertTo12HourFormat(messageTime);
    await admin.messaging().sendEachForMulticast(message);
    const messageData = {
      title: messageTitle,
      body: messageBody,
      time: timeIn12HourFormat,
      username: username,
      clientName: client_for,
    };

    // Inserting the order into the orders table
    await query("INSERT INTO notifications SET ?", messageData);

    const smsmessage = `Dear Valued Customer:
Your Service Order with ID: ${orderID}
Details: ${cars} cars ${description} has been Submitted Successfully.
Regards, 
Clicklife Customer Service`;

    // sma data
    const smsreport = {
      client: client_for,
      description: smsmessage,
      date: datePart,
    };
    await query("INSERT INTO sms_report SET ?", smsreport);

    // Prepare the data in the required format
    const smsData = [
      {
        user: "20099576", // Replace with your profile ID
        pwd: "Clicklife@123", // Replace with your password
        number: phone, // Replace with the recipient's mobile number including country code
        msg: smsmessage, // Your text message
        sender: "ClickLife", // Replace with your sender ID
        language: "English", // Language set to English
      },
    ];
    // Send the request
    const response = axios
      .post("https://mshastra.com/sendsms_api_json.aspx", smsData)
      .then((response) => {
        res.status(200).send({
          success: true,
          message: "Create Order Successfully!",
          response: response.data,
          result,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// update order
const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const updatedOrderData = req.body; // Get updated order data from request body
    const result = await query("UPDATE orders SET ? WHERE id = ?", [
      updatedOrderData,
      orderId,
    ]);
    res.status(200).send({
      success: true,
      message: "Order Updated Successfully!",
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// delete order
const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const results = await query("DELETE FROM orders WHERE id = ?", [orderId]);
    res.status(200).send({
      success: true,
      message: "Order Delete Successfully!",
      results,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// pick order

const pickOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const {
      technician,
      status,
      Country,
      client_for,
      username,
      phone,
      orderNumberOfCars,
      selectedOrder,
    } = req.body; // Assuming userId is sent in the request body
    // Update the order with the assigned user
    const result = await query(
      "UPDATE orders SET technician = ?, status = ? WHERE id = ?",
      [technician, status, orderId]
    );
    // Fetch device tokens for users
    const userTokensResult = await query(
      `
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department != 'Technician') 
            UNION 
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department = 'Technician' AND country = ?) 
            UNION 
            (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
      [Country, client_for]
    );
    //(SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department != 'Technician') UNION (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department = 'Technician' AND country = ?) UNION (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?);
    if (userTokensResult.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No users found in the specified id",
      });
    }

    // Extract device tokens from the result
    // const deviceTokens = userTokensResult.map(user => user.device_token);
    const deviceTokens = userTokensResult
      .map((user) => user.device_token)
      .filter((token) => token);

    // Send push notification
    const message = {
      notification: {
        title: "Order Picked Up",
        body: `${username} Picked up Order for ${client_for}.`,
      },
      tokens: deviceTokens,
    };

    const messageTitle = message.notification.title;
    const messageBody = message.notification.body;
    // Get current date and time in local time zone
    const date = new Date();
    const datePart = date.toISOString().split("T")[0];
    const timePart = date.toLocaleTimeString("en-US", {
      hour12: false,
    });
    const messageTime = `${datePart} ${timePart}`;
    const timeIn12HourFormat = convertTo12HourFormat(messageTime);
    await admin.messaging().sendEachForMulticast(message);
    const messageData = {
      title: messageTitle,
      body: messageBody,
      time: timeIn12HourFormat,
      username: username,
      clientName: client_for,
    };

    // Inserting the order into the orders table
    await query("INSERT INTO notifications SET ?", messageData);
    const smsmessage = `Dear Valued Customer:
Your Service Order with ID: ${orderId}
Details: ${orderNumberOfCars} cars ${selectedOrder} has been Picked up by our Technician ${technician}. Our Technician will be there in 20 Minutes
Regards, 
Clicklife Customer Service`;

    // sma data
    const smsreport = {
      client: client_for,
      description: smsmessage,
      date: datePart,
    };
    await query("INSERT INTO sms_report SET ?", smsreport);

    // Prepare the data in the required format
    const smsData = [
      {
        user: "20099576", // Replace with your profile ID
        pwd: "Clicklife@123", // Replace with your password
        number: phone, // Replace with the recipient's mobile number including country code
        msg: smsmessage, // Your text message
        sender: "ClickLife", // Replace with your sender ID
        language: "English", // Language set to English
      },
    ];

    // Send the request
    const response = axios
      .post("https://mshastra.com/sendsms_api_json.aspx", smsData)
      .then((response) => {
        res.status(200).send({
          success: true,
          message: "Order proceed Successfully!",
          response: response.data,
          result,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// mark order

const markOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const {
      status,
      Country,
      client_for,
      username,
      phone,
      orderCars,
      orderDescription,
    } = req.body; // Assuming userId is sent in the request body
    // Update the order with the assigned user
    const result = await query("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      orderId,
    ]);
    // Fetch device tokens for users
    const userTokensResult = await query(
      `
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department != 'Technician') 
            UNION 
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department = 'Technician' AND country = ?) 
            UNION 
            (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
      [Country, client_for]
    );
    //(SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department != 'Technician') UNION (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department = 'Technician' AND country = ?) UNION (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?);
    if (userTokensResult.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No users found in the specified id",
      });
    }

    // Extract device tokens from the result
    // const deviceTokens = userTokensResult.map(user => user.device_token);
    const deviceTokens = userTokensResult
      .map((user) => user.device_token)
      .filter((token) => token);

    // Send push notification
    const message = {
      notification: {
        title: "Order Completed",
        body: `${username} Completed Order for ${client_for}.`,
      },
      tokens: deviceTokens,
    };

    const messageTitle = message.notification.title;
    const messageBody = message.notification.body;
    // Get current date and time in local time zone
    const date = new Date();
    const datePart = date.toISOString().split("T")[0];
    const timePart = date.toLocaleTimeString("en-US", {
      hour12: false,
    });
    const messageTime = `${datePart} ${timePart}`;
    const timeIn12HourFormat = convertTo12HourFormat(messageTime);
    await admin.messaging().sendEachForMulticast(message);

    const messageData = {
      title: messageTitle,
      body: messageBody,
      time: timeIn12HourFormat,
      username: username,
      clientName: client_for,
    };

    // Inserting the order into the orders table
    await query("INSERT INTO notifications SET ?", messageData);
    const smsmessage = `Dear Valued Customer:
Your Service Order with ID: ${orderId}
Details: ${orderCars} cars ${orderDescription} has been Completed Successfully. Thank you for using Our Service.
Regards,
Clicklife Customer Service`;

    // sma data
    const smsreport = {
      client: client_for,
      description: smsmessage,
      date: datePart,
    };
    await query("INSERT INTO sms_report SET ?", smsreport);

    // Prepare the data in the required format
    const smsData = [
      {
        user: "20099576", // Replace with your profile ID
        pwd: "Clicklife@123", // Replace with your password
        number: phone, // Replace with the recipient's mobile number including country code
        msg: smsmessage, // Your text message
        sender: "ClickLife", // Replace with your sender ID
        language: "English", // Language set to English
      },
    ];

    // Send the request
    const response = axios
      .post("https://mshastra.com/sendsms_api_json.aspx", smsData)
      .then((response) => {
        res.status(200).send({
          success: true,
          message: "Order Marked Successfully!",
          response: response.data,
          result,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// feedback

const feedbackController = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { rating, feedback } = req.body; // Assuming userId is sent in the request body

    // Insert the feedback into the orders table
    const result = await query(
      "UPDATE orders SET rating = ?, feedback = ? WHERE id = ?",
      [rating, feedback, orderId]
    );
    res.status(200).send({
      success: true,
      message: "Feedback submitted!",
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Get all completed orders that complete in current month for a technician

const currentMonthCompletedOrders = async (req, res) => {
  try {
    const { username } = req.body;
    const result = await query(
      `SELECT COUNT(*) AS count FROM orders WHERE technician = ? AND status = 2 AND MONTH(solve_date) = MONTH(CURRENT_DATE()) AND YEAR(solve_date) = YEAR(CURRENT_DATE())`,
      [username]
    );
    res.status(200).send({
      success: true,
      message: "All completed orders that complete in current month!",
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const orderNotification = async (req, res) => {
  try {
    const { client_for, country, title, body, username } = req.body; // Assuming loginType is passed in the request body

    // Fetch device tokens for users
    const userTokensResult = await query(
      `
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department != 'Technician') 
            UNION 
            (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department = 'Technician' AND country = ?) 
            UNION 
            (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
      [country, client_for]
    );
    //(SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department != 'Technician') UNION (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department = 'Technician' AND country = ?) UNION (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?);
    if (userTokensResult.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No users found in the specified id",
      });
    }

    // Extract device tokens from the result
    // const deviceTokens = userTokensResult.map(user => user.device_token);
    const deviceTokens = userTokensResult
      .map((user) => user.device_token)
      .filter((token) => token);

    // Send push notification
    const message = {
      notification: {
        title: `${title}`,
        body: `${body}`,
      },
      tokens: deviceTokens,
    };

    const messageTitle = message.notification.title;
    const messageBody = message.notification.body;
    // Get current date and time in local time zone
    const date = new Date();
    const datePart = date.toISOString().split("T")[0];
    const timePart = date.toLocaleTimeString("en-US", {
      hour12: false,
    });
    const messageTime = `${datePart} ${timePart}`;
    const timeIn12HourFormat = convertTo12HourFormat(messageTime);
    await admin.messaging().sendEachForMulticast(message);

    const messageData = {
      title: messageTitle,
      body: messageBody,
      time: timeIn12HourFormat,
      username: username,
      clientName: client_for,
    };

    // Inserting the order into the orders table
    await query("INSERT INTO notifications SET ?", messageData);

    res.status(200).send({
      success: true,
      message: "Notification Sent Successfully!",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  updateOrder,
  getClientData,
  deleteOrder,
  pickOrder,
  markOrder,
  feedbackController,
  currentMonthCompletedOrders,
  orderNotification,
};

//SELECT COUNT(*) AS count FROM orders WHERE technician = ? AND status = 2 AND MONTH(solve_date) = MONTH(CURRENT_DATE()) AND YEAR(solve_date) = YEAR(CURRENT_DATE());
