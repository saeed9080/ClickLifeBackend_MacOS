const query = require("../config/db");
const admin = require("../config/firebaseService");
// get all complains

const getAllComplains = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const result = await query(
      `SELECT * FROM complains ORDER BY status ASC LIMIT ${limit} OFFSET ${offset}`
    );
    const comlainresults = await query(
      `SELECT * FROM complains ORDER BY status ASC`
    );
    const latestComplain = await query(
      `SELECT * FROM complains ORDER BY id DESC LIMIT 1`
    );
    res.status(200).send({
      success: true,
      result,
      comlainresults,
      latestComplain,
    });
  } catch (error) {
    res.status(400).send({
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

// create complain

const createComplain = async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      loginType,
      client,
      phone,
      dep_name,
      username,
      description,
      country,
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
    const complainData = {
      client,
      phone,
      made_by: clientName || req.body.made_by,
      dep_name,
      description,
      issue_date: issue_date, // Automatically generated issue_date
    };

    // Fetch device tokens for users
    // const userTokensResult = await query(
    //   `
    //   (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department = ? AND country = ?)
    //   UNION
    //   (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
    //   [dep_name, country, client]
    // );

    let userTokensResult;
    if (country) {
      userTokensResult = await query(
        `
    (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department = ? AND country = ?) 
    UNION 
    (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
        [dep_name, country, client]
      );
    } else {
      userTokensResult = await query(
        `
    (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND department = ?) 
    UNION 
    (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
        [dep_name, client]
      );
    }

    if (userTokensResult.length !== 0) {
      // Inserting the order into the complains table
      const result = await query("INSERT INTO complains SET ?", complainData);
      // Extract device tokens from the result
      // const deviceTokens = userTokensResult.map(user => user.device_token);
      const deviceTokens = userTokensResult
        .map((user) => user.device_token)
        .filter((token) => token);

      // Send push notification
      const message = {
        notification: {
          title: "Complain Created",
          body: `${username} Created Complain for ${complainData.client}.`,
        },
        tokens: deviceTokens,
      };
      await admin.messaging().sendEachForMulticast(message);
      res.status(200).send({
        success: true,
        message: "Create Complain Successfully!",
        result,
      });
    } else {
      return res.status(404).send({
        success: false,
        message: "Sorry, client login first. Then try again.",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// issue solved

const issuesolved = async (req, res) => {
  try {
    const complainId = req.params.complainId;
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

    const solve_date = getFormattedLocalDateTime(); // This will print the current date and time in yyyy-mm-dd hh:mm:ss format
    const { status, client, country, username, department } = req.body;

    // const userTokensResult = await query(
    //   `
    //   (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department = ? AND country = ?)
    //   UNION
    //   (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
    //   [department, country, client]
    // );
    let userTokensResult;
    if (country) {
      userTokensResult = await query(
        `
    (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department = ? AND country = ?) 
    UNION 
    (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
        [department, country, client]
      );
    } else {
      userTokensResult = await query(
        `
    (SELECT device_token FROM Users WHERE device_token IS NOT NULL AND Department = ?) 
    UNION 
    (SELECT device_token FROM client WHERE device_token IS NOT NULL AND Namee = ?)`,
        [department, client]
      );
    }
    if (userTokensResult.length !== 0) {
      // Update the complains with the assigned user
      const result = await query(
        "UPDATE complains SET status = ?, solve_date = ? WHERE id = ?",
        [status, solve_date, complainId]
      );
      // Extract device tokens from the result
      // const deviceTokens = userTokensResult.map(user => user.device_token);
      const deviceTokens = userTokensResult
        .map((user) => user.device_token)
        .filter((token) => token);

      // Send push notification
      const message = {
        notification: {
          title: "Issue Solved",
          body: `${username} Solved Issue for ${client}.`,
        },
        tokens: deviceTokens,
      };
      await admin.messaging().sendEachForMulticast(message);
      res.status(200).send({
        success: true,
        message: "Issue Solved Successfully!",
        result,
      });
    } else {
      return res.status(404).send({
        success: false,
        message: "Sorry, client login first. Then try again.",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// update order
const updateComplain = async (req, res) => {
  try {
    const complainId = req.params.complainId;
    const updatedComplainData = req.body; // Get updated complain data from request body
    const result = await query("UPDATE complains SET ? WHERE id = ?", [
      updatedComplainData,
      complainId,
    ]);
    res.status(200).send({
      success: true,
      message: "Complain Updated Successfully!",
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// delete complain
const deleteComplain = async (req, res) => {
  try {
    const complainId = req.params.complainId;
    const results = await query("DELETE FROM complains WHERE id = ?", [
      complainId,
    ]);
    res.status(200).send({
      success: true,
      message: "Complain Delete Successfully!",
      results,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllComplains,
  getClientData,
  createComplain,
  issuesolved,
  updateComplain,
  deleteComplain,
};
