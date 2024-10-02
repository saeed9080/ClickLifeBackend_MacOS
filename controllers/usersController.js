const jwt = require("jsonwebtoken");
const query = require("../config/db");

const adminLoginController = async (req, res) => {
  try {
    const { email, password, loginType, DeviceToken } = req.body;
    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password is required",
      });
    }
    const q = "SELECT * FROM Users WHERE email = ? AND password = ?";
    const results = await query(q, [email, password]);
    if (results.length > 0) {
      const user = results[0];
      const userId = results[0].id;
      // Save the device token in the database
      await query("UPDATE Users SET device_token = ? WHERE id = ?", [
        DeviceToken,
        userId,
      ]);
      if (user.department !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: Not an Admin",
        });
      }
      const token = jwt.sign(
        {
          userId: results[0].id,
          email: results[0].email,
          password: results[0].password,
          img: results[0].img,
          country: results[0].country,
        },
        process.env.JWT_SECRET
      );
      const name = results[0].Namee;
      const department = user.department;
      res.cookie("token", token, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("User ID", userId, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("User Name", name, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("Login Type", loginType, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("Department", department, {
        secure: true,
        httpOnly: true,
      });
      // Fetch user's department
      return res.status(200).send({
        success: true,
        message: "Login Successfully!",
        results: results,
        department: department,
        userId: user.id,
        name: user.Namee,
        token: token,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const staffLoginController = async (req, res) => {
  try {
    const { email, password, loginType, DeviceToken } = req.body;
    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password is required",
      });
    }
    const q = "SELECT * FROM Users WHERE email = ? AND password = ?";
    const results = await query(q, [email, password]);
    if (results.length > 0) {
      const user = results[0];
      const userId = results[0].id;
      // Save the device token in the database
      await query("UPDATE Users SET device_token = ? WHERE id = ?", [
        DeviceToken,
        userId,
      ]);
      if (user.email !== email && user.department === "Admin") {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: User in Staff",
        });
      }
      const token = jwt.sign(
        {
          userId: results[0].id,
          email: results[0].email,
          email: results[0].email,
          password: results[0].password,
          img: results[0].img,
          country: results[0].country,
        },
        process.env.JWT_SECRET
      );
      const name = results[0].Namee;
      const department = user.department;
      const country = user.country;
      res.cookie("token", token, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("User ID", userId, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("User Name", name, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("Login Type", loginType, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("Department", department, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("Country", country, {
        secure: true,
        httpOnly: true,
      });
      // Fetch user's department
      return res.status(200).send({
        success: true,
        message: "Login Successfully!",
        results: results,
        department: department,
        country: country,
        userId: user.id,
        name: user.Namee,
        token: token,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const clientLoginController = async (req, res) => {
  try {
    const { Email, password, loginType, DeviceToken } = req.body;
    // validation
    if (!Email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password is required",
      });
    }
    const q = "SELECT * FROM client WHERE Email = ? AND password = ?";
    const results = await query(q, [Email, password]);
    if (results.length > 0) {
      const user = results[0];
      const userId = results[0].id;
      // Save the device token in the database
      await query("UPDATE client SET device_token = ? WHERE id = ?", [
        DeviceToken,
        userId,
      ]);
      const token = jwt.sign(
        {
          userId: results[0].id,
          Email: results[0].Email, //Client table : Img trade_name Auth-person auth phone city website password address phone
          trade_name: results[0].trade_name,
          auth_person: results[0].auth_person,
          auth_phone: results[0].auth_phone,
          city: results[0].city,
          website: results[0].website,
          password: results[0].password,
          phone: results[0].phone,
          img: results[0].img,
        },
        process.env.JWT_SECRET
      );
      const name = results[0].Namee;
      const country = user.country;
      res.cookie("token", token, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("User ID", userId, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("User Name", name, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("Login Type", loginType, {
        secure: true,
        httpOnly: true,
      });
      res.cookie("Country", country, {
        secure: true,
        httpOnly: true,
      });
      return res.status(200).send({
        success: true,
        message: "Login Successfully!",
        userId: user.id,
        name: user.Namee,
        country: country,
        results: results,
        token: token,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserFromDatabase = async (userId, loginType) => {
  try {
    let result;
    if (loginType === "admin" || loginType === "staff") {
      result = await query(
        "SELECT id, email, password, img, country FROM Users WHERE id = ?",
        [userId]
      );
    }
    if (loginType === "client") {
      result = await query(
        "SELECT id, trade_name, auth_person, auth_phone, city, website, password, address, Phone, img FROM client WHERE id = ?",
        [userId]
      );
    }
    return result;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

// logged user

const loggedUserController = async (req, res) => {
  try {
    const { loginType } = req.body;
    // Fetch the latest user data from the database
    const user = await getUserFromDatabase(req.userData.userId, loginType); // Implement this function to fetch user data
    if (user) {
      return res.status(200).send({
        success: true,
        message: "Logged User Successfully!",
        user,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "UnAuthorized User",
      });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(401).json({
      success: false,
      message: "UnAuthorized User",
    });
  }
};

const logoutController = async (req, res) => {
  try {
    res.clearCookie("token");
    res.clearCookie("User ID");
    res.clearCookie("User Name");
    res.clearCookie("Login Type");
    res.clearCookie("Department");
    res.clearCookie("Country");
    res.status(200).json({
      success: true,
      message: "Logout Successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update user
const updateUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      trade_name,
      auth_person,
      auth_phone,
      city,
      website,
      password,
      address,
      Phone,
      email,
      country,
      loginType,
    } = req.body;
    let sql;
    let params;
    let img;
    const baseURL = `${req.protocol}://${req.get("host")}/uploads/`; // Construct the base URL

    if (req.file) {
      img = baseURL + req.file.filename; // Save the full URL
    } else {
      img = req.body.img; // Use the existing image URL if no new image is uploaded
    }
    if (loginType === "client") {
      sql =
        "UPDATE client SET trade_name = ?, auth_person = ?, auth_phone = ?, city = ?, website = ?, password = ?, address = ?, Phone = ?, img = ? WHERE id = ?";
      params = [
        trade_name,
        auth_person,
        auth_phone,
        city,
        website,
        password,
        address,
        Phone,
        img,
        userId,
      ];
    } else if (loginType === "admin" || loginType === "staff") {
      sql =
        "UPDATE Users SET email = ?, password = ?, img = ?, country = ? WHERE id = ?";
      params = [email, password, img, country, userId];
    }
    const results = await query(sql, params);
    if (results.affectedRows > 0) {
      return res.status(200).send({
        success: true,
        message: "User Updated Successfully!",
        results: results,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  clientLoginController,
  loggedUserController,
  logoutController,
  staffLoginController,
  adminLoginController,
  updateUserController,
};
