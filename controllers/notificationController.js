const query = require("../config/db")

// get all notifications

const getAllNotifications = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const notificationsresults = await query('SELECT * FROM notifications ORDER BY id DESC');
        const result = await query(`SELECT * FROM notifications LIMIT ${limit} OFFSET ${offset}`)
        res.status(200).send({
            success: true,
            result,
            notificationsresults
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message,
        })
    }
}

module.exports = {
    getAllNotifications,
}