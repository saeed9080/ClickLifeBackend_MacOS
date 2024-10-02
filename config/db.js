const mysql = require("mysql");
const colors = require("colors");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10, // Adjust as needed based on your requirements
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

// Log a message when the database is connected
pool.on("connection", () => {
  console.log("Database connected.".bgMagenta.white);
});

// Export a function to query the database
const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    // Get a connection from the pool
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        // Execute the query with the provided values
        connection.query(sql, values, (err, results) => {
          // Release the connection back to the pool
          connection.release();
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      }
    });
  });
};

module.exports = query;
