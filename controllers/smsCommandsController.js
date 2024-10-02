const query = require("../config/db")

// get all smscommands

const getAllSMSCommands = async (req, res) => {
    try {
        const smsCommandsQuery = `SELECT * FROM sms_commands`;
        const smscommandsresult = await query(smsCommandsQuery);
        res.status(200).send({
            success: true,
            smscommandsresult
        });
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message,
        });
    }
};

// update smscommands

const updateSMSCommands = async (req, res) => {
    try {
        const smscommandId = req.params.smscommandId;
        const {on_val, off_val} = req.body; // Get updated client data from request body
        const result = await query("UPDATE sms_commands SET on_val = ?, off_val = ? WHERE id = ?", [on_val, off_val, smscommandId]);
        res.status(200).send({
            success: true,
            message: "SMSCommands Updated Successfully!",
            result,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAllSMSCommands,
    updateSMSCommands,
}