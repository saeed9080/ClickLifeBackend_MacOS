const jwt = require("jsonwebtoken");
const query = require("../config/db");
const bcrypt = require("bcrypt");
const argon2 = require("argon2"); // use argon2 for PHP Argon2ID hashes

const adminLoginController = async (req, res) => {
  try {
    const { email, password, loginType, DeviceToken } = req.body;

    const maxAttempts = 3;
    const blockTime = 10; // 5 minutes
    const pepper = "mySuperSecretPepperKeyTAQI!";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // ===============================
    // 1️⃣ Check login attempts
    // ===============================
    const attemptQuery =
      "SELECT attempts, last_attempt_time FROM login_attempts WHERE email = ? AND ip_address = ?";
    const attemptResult = await query(attemptQuery, [email, ipAddress]);

    let attempts = attemptResult[0]?.attempts || 0;
    let lastTime = attemptResult[0]?.last_attempt_time || 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - lastTime;

    if (attempts >= maxAttempts && timeDiff < blockTime) {
      return res.status(429).json({
        success: false,
        message: `Too many login attempts! Try again in ${
          blockTime - timeDiff
        } seconds.`,
      });
    }

    if (timeDiff >= blockTime) {
      attempts = 0; // reset after block time
    }

    // ===============================
    // 2️⃣ Fetch Admin User
    // ===============================
    const userQuery = "SELECT * FROM Users WHERE email = ?";
    const results = await query(userQuery, [email]);

    if (!results.length) {
      await handleFailedAttempt();
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = results[0];
    console.log("db pass: ", user.password);
    // ===============================
    // 3️⃣ Verify password (Argon2ID + pepper)
    // ===============================
    const isMatch = await argon2.verify(user.password, password + pepper);
    console.log("isMatch: ", isMatch);
    if (!isMatch) {
      await handleFailedAttempt();
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. Attempt ${attempts} of ${maxAttempts}`,
      });
    }

    // ===============================
    // 4️⃣ Reset attempts on successful login
    // ===============================
    await query(
      `INSERT INTO login_attempts (email, ip_address, attempts, last_attempt_time)
       VALUES (?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE attempts = 0, last_attempt_time = ?`,
      [email, ipAddress, currentTime, currentTime],
    );

    // Save device token
    await query("UPDATE Users SET device_token = ? WHERE id = ?", [
      DeviceToken,
      user.id,
    ]);

    if (user.department !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Not an Admin",
      });
    }

    // ===============================
    // 5️⃣ Create JWT
    // ===============================
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        img: user.img,
        country: user.country,
      },
      process.env.JWT_SECRET,
    );

    res.cookie("token", token, {
      secure: true,
      httpOnly: true,
    });
    res.cookie("User ID", user.id, { secure: true, httpOnly: true });
    res.cookie("User Name", user.Namee, { secure: true, httpOnly: true });
    res.cookie("Login Type", loginType, { secure: true, httpOnly: true });
    res.cookie("Department", user.department, { secure: true, httpOnly: true });

    return res.status(200).json({
      success: true,
      message: "Login Successfully!",
      results: results,
      department: user.department,
      userId: user.id,
      name: user.Namee,
      token: token,
    });

    // ===============================
    // Helper Function
    // ===============================
    async function handleFailedAttempt() {
      attempts++;

      await query(
        `INSERT INTO login_attempts (email, ip_address, attempts, last_attempt_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE attempts = ?, last_attempt_time = ?`,
        [email, ipAddress, attempts, currentTime, attempts, currentTime],
      );
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// const adminLoginController = async (req, res) => {
//   try {
//     const { email, password, loginType, DeviceToken } = req.body;
//     // validation
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password is required",
//       });
//     }
//     const q = "SELECT * FROM Users WHERE email = ? AND password = ?";
//     const results = await query(q, [email, password]);
//     if (results.length > 0) {
//       const user = results[0];
//       const userId = results[0].id;
//       // Save the device token in the database
//       await query("UPDATE Users SET device_token = ? WHERE id = ?", [
//         DeviceToken,
//         userId,
//       ]);
//       if (user.department !== "Admin") {
//         return res.status(403).json({
//           success: false,
//           message: "Unauthorized: Not an Admin",
//         });
//       }
//       const token = jwt.sign(
//         {
//           userId: results[0].id,
//           email: results[0].email,
//           password: results[0].password,
//           img: results[0].img,
//           country: results[0].country,
//         },
//         process.env.JWT_SECRET,
//       );
//       const name = results[0].Namee;
//       const department = user.department;
//       res.cookie("token", token, {
//         secure: true,
//         httpOnly: true,
//       });
//       res.cookie("User ID", userId, {
//         secure: true,
//         httpOnly: true,
//       });
//       res.cookie("User Name", name, {
//         secure: true,
//         httpOnly: true,
//       });
//       res.cookie("Login Type", loginType, {
//         secure: true,
//         httpOnly: true,
//       });
//       res.cookie("Department", department, {
//         secure: true,
//         httpOnly: true,
//       });
//       // Fetch user's department
//       return res.status(200).send({
//         success: true,
//         message: "Login Successfully!",
//         results: results,
//         department: department,
//         userId: user.id,
//         name: user.Namee,
//         token: token,
//       });
//     } else {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const staffLoginController = async (req, res) => {
  try {
    const { email, password, loginType, DeviceToken } = req.body;

    const maxAttempts = 3;
    const blockTime = 10; // 5 minutes
    const pepper = "mySuperSecretPepperKeyTAQI!";

    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password is required",
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // ===============================
    // 1️⃣ Check login attempts
    // ===============================
    const attemptQuery =
      "SELECT attempts, last_attempt_time FROM login_attempts WHERE email = ? AND ip_address = ?";
    const attemptResult = await query(attemptQuery, [email, ipAddress]);

    let attempts = attemptResult[0]?.attempts || 0;
    let lastTime = attemptResult[0]?.last_attempt_time || 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - lastTime;

    if (attempts >= maxAttempts && timeDiff < blockTime) {
      return res.status(429).json({
        success: false,
        message: `Too many login attempts! Try again in ${
          blockTime - timeDiff
        } seconds.`,
      });
    }

    if (timeDiff >= blockTime) {
      attempts = 0; // reset after block time
    }

    // ===============================
    // 2️⃣ Fetch Staff User
    // ===============================
    const userQuery = "SELECT * FROM Users WHERE email = ?";
    const results = await query(userQuery, [email]);

    if (!results.length) {
      await handleFailedAttempt();
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    // ===============================
    // 3️⃣ Verify password (Argon2ID + pepper)
    // ===============================
    const isMatch = await argon2.verify(user.password, password + pepper);

    if (!isMatch) {
      await handleFailedAttempt();
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. Attempt ${attempts} of ${maxAttempts}`,
      });
    }

    // ===============================
    // 4️⃣ Reset attempts on successful login
    // ===============================
    await query(
      `INSERT INTO login_attempts (email, ip_address, attempts, last_attempt_time)
       VALUES (?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE attempts = 0, last_attempt_time = ?`,
      [email, ipAddress, currentTime, currentTime],
    );

    // Save device token
    await query("UPDATE Users SET device_token = ? WHERE id = ?", [
      DeviceToken,
      user.id,
    ]);

    if (user.email !== email && user.department === "Admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Not a Staff",
      });
    }

    // ===============================
    // 5️⃣ Create JWT
    // ===============================
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        img: user.img,
        country: user.country,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, {
      secure: true,
      httpOnly: true,
    });
    res.cookie("User ID", user.id, { secure: true, httpOnly: true });
    res.cookie("User Name", user.Namee, { secure: true, httpOnly: true });
    res.cookie("Login Type", loginType, { secure: true, httpOnly: true });
    res.cookie("Department", user.department, { secure: true, httpOnly: true });
    res.cookie("Country", user.country, { secure: true, httpOnly: true });

    return res.status(200).json({
      success: true,
      message: "Login Successfully!",
      results: results,
      department: user.department,
      country: user.country,
      userId: user.id,
      name: user.Namee,
      token: token,
    });

    // ===============================
    // Helper Function
    // ===============================
    async function handleFailedAttempt() {
      attempts++;

      await query(
        `INSERT INTO login_attempts (email, ip_address, attempts, last_attempt_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE attempts = ?, last_attempt_time = ?`,
        [email, ipAddress, attempts, currentTime, attempts, currentTime],
      );
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

    const maxAttempts = 3;
    const blockTime = 300; // 5 minutes
    const pepper = "mySuperSecretPepperKeyTAQI!";

    // validation
    if (!Email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password is required",
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // ===============================
    // 1️⃣ Check login attempts
    // ===============================
    const attemptQuery =
      "SELECT attempts, last_attempt_time FROM login_attempts WHERE email = ? AND ip_address = ?";
    const attemptResult = await query(attemptQuery, [Email, ipAddress]);

    let attempts = attemptResult[0]?.attempts || 0;
    let lastTime = attemptResult[0]?.last_attempt_time || 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - lastTime;

    if (attempts >= maxAttempts && timeDiff < blockTime) {
      return res.status(429).json({
        success: false,
        message: `Too many login attempts! Try again in ${
          blockTime - timeDiff
        } seconds.`,
      });
    }

    if (timeDiff >= blockTime) {
      attempts = 0; // reset after block time
    }

    // ===============================
    // 2️⃣ Fetch Client User
    // ===============================
    const userQuery = "SELECT * FROM client WHERE email = ?";
    const results = await query(userQuery, [Email]);

    if (!results.length) {
      await handleFailedAttempt();
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    // ===============================
    // 3️⃣ Verify password (Argon2ID + pepper)
    // ===============================
    const isMatch = await argon2.verify(user.password, password + pepper);

    if (!isMatch) {
      await handleFailedAttempt();
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. Attempt ${attempts} of ${maxAttempts}`,
      });
    }

    // ===============================
    // 4️⃣ Reset attempts on successful login
    // ===============================
    await query(
      `INSERT INTO login_attempts (email, ip_address, attempts, last_attempt_time)
       VALUES (?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE attempts = 0, last_attempt_time = ?`,
      [Email, ipAddress, currentTime, currentTime],
    );

    // Save device token
    await query("UPDATE client SET device_token = ? WHERE id = ?", [
      DeviceToken,
      user.id,
    ]);

    // ===============================
    // 5️⃣ Create JWT
    // ===============================
    const token = jwt.sign(
      {
        userId: user.id,
        Email: user.Email, //Client table : Img trade_name Auth-person auth phone city website password address phone
        trade_name: user.trade_name,
        auth_person: user.auth_person,
        auth_phone: user.auth_phone,
        city: user.city,
        website: user.website,
        phone: user.phone,
        img: user.img,
      },
      process.env.JWT_SECRET,
    );

    res.cookie("token", token, {
      secure: true,
      httpOnly: true,
    });
    res.cookie("User ID", user.id, { secure: true, httpOnly: true });
    res.cookie("User Name", user.Namee, { secure: true, httpOnly: true });
    res.cookie("Login Type", loginType, { secure: true, httpOnly: true });
    res.cookie("Country", user.country, { secure: true, httpOnly: true });

    return res.status(200).json({
      success: true,
      message: "Login Successfully!",
      userId: user.id,
      name: user.Namee,
      country: user.country,
      results: results,
      token: token,
    });

    // ===============================
    // Helper Function
    // ===============================
    async function handleFailedAttempt() {
      attempts++;

      await query(
        `INSERT INTO login_attempts (email, ip_address, attempts, last_attempt_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE attempts = ?, last_attempt_time = ?`,
        [Email, ipAddress, attempts, currentTime, attempts, currentTime],
      );
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
        [userId],
      );
    }
    if (loginType === "client") {
      result = await query(
        "SELECT id, trade_name, auth_person, auth_phone, city, website, password, address, Phone, img FROM client WHERE id = ?",
        [userId],
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

    const pepper = "mySuperSecretPepperKeyTAQI!"; // same as login

    let sql;
    let params;
    let img;
    const baseURL = `${req.protocol}://${req.get("host")}/uploads/`;

    if (req.file) {
      img = baseURL + req.file.filename;
    } else {
      img = req.body.img;
    }

    let hashedPassword = password;

    // Only hash password if it is provided
    if (password) {
      // Hash using Argon2ID + pepper
      hashedPassword = await argon2.hash(password + pepper, {
        type: argon2.argon2id,
        memoryCost: 2 ** 17, // 131072 KB
        timeCost: 4,
        parallelism: 2,
      });
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
        hashedPassword,
        address,
        Phone,
        img,
        userId,
      ];
    } else if (loginType === "admin" || loginType === "staff") {
      sql =
        "UPDATE Users SET email = ?, password = ?, img = ?, country = ? WHERE id = ?";
      params = [email, hashedPassword, img, country, userId];
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

// const updateUserController = async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const {
//       trade_name,
//       auth_person,
//       auth_phone,
//       city,
//       website,
//       password,
//       address,
//       Phone,
//       email,
//       country,
//       loginType,
//     } = req.body;
//     let sql;
//     let params;
//     let img;
//     const baseURL = `${req.protocol}://${req.get("host")}/uploads/`; // Construct the base URL

//     if (req.file) {
//       img = baseURL + req.file.filename; // Save the full URL
//     } else {
//       img = req.body.img; // Use the existing image URL if no new image is uploaded
//     }
//     if (loginType === "client") {
//       sql =
//         "UPDATE client SET trade_name = ?, auth_person = ?, auth_phone = ?, city = ?, website = ?, password = ?, address = ?, Phone = ?, img = ? WHERE id = ?";
//       params = [
//         trade_name,
//         auth_person,
//         auth_phone,
//         city,
//         website,
//         password,
//         address,
//         Phone,
//         img,
//         userId,
//       ];
//     } else if (loginType === "admin" || loginType === "staff") {
//       sql =
//         "UPDATE Users SET email = ?, password = ?, img = ?, country = ? WHERE id = ?";
//       params = [email, password, img, country, userId];
//     }
//     const results = await query(sql, params);
//     if (results.affectedRows > 0) {
//       return res.status(200).send({
//         success: true,
//         message: "User Updated Successfully!",
//         results: results,
//       });
//     } else {
//       return res.status(404).json({
//         success: false,
//         message: "User Not Found",
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

module.exports = {
  clientLoginController,
  loggedUserController,
  logoutController,
  staffLoginController,
  adminLoginController,
  updateUserController,
};
