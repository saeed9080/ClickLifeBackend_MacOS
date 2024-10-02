const query = require("../config/db")

// get all vehicles

const getAllDevices = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const vehicleIMEI = await query("SELECT IMEI FROM vehicle");
        const devicesresults = await query('SELECT * FROM devices');
        const result = await query(`SELECT * FROM devices LIMIT ${limit} OFFSET ${offset}`);
        const vehicleIMEIs = vehicleIMEI.map(vehicle => vehicle.IMEI);
        const devicesWithStatus = devicesresults.map(device => ({
            ...device,
            status: vehicleIMEIs.includes(device.IMEI) ? 'Installed' : 'Not Installed'
        }));
        const installedCount = devicesWithStatus.filter(IMEI => IMEI.status === 'Installed').length;
        const notInstalledCount = devicesWithStatus.filter(IMEI => IMEI.status === 'Not Installed').length;
        res.status(200).send({ 
            success: true,
            installedCount,
            notInstalledCount,
            result,
            devicesWithStatus : devicesWithStatus,
            devicesresults,
            vehicleIMEI
        })
    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message,
        })
    }
}

// searchController 

const searchController = async (req, res) => {
    try {
        const { IMEI } = req.body;

        // Fetch vehicle IMEIs
        const vehicleIMEIResults = await query("SELECT IMEI FROM vehicle");
        const vehicleIMEIs = vehicleIMEIResults.map(vehicle => vehicle.IMEI);

        // Search devices by IMEI
        let sql = `SELECT * FROM devices WHERE IMEI LIKE '%${IMEI}%'`;
        const results = await query(sql);

        // Add status to each result based on IMEI match
        const resultsWithStatus = results.map(device => ({
            ...device,
            status: vehicleIMEIs.includes(device.IMEI) ? 'Installed' : 'Not Installed'
        }));
        res.status(200).json({
            success: true,
            message: "Search results",
            total_vehicle_length: resultsWithStatus.length,
            result: resultsWithStatus
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    getAllDevices,
    searchController,
}