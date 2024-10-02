const query = require("../config/db")

// get all vehicles

const getAllSimCardFinance = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const vehicleSim_Number = await query("SELECT Sim_Number FROM vehicle");
        const simcardfinanceresults = await query('SELECT * FROM SimCardFinance');
        const result = await query(`SELECT * FROM SimCardFinance LIMIT ${limit} OFFSET ${offset}`);
        const vehicleSimNumbers = vehicleSim_Number.map(vehicle => vehicle.Sim_Number);
        const simcardfinanceWithStatus = simcardfinanceresults.map(simcardfinance => ({
            ...simcardfinance,
            status: vehicleSimNumbers.includes(simcardfinance.sim) ? 'Installed' : 'Not Installed'
        }));
        const installedCount = simcardfinanceWithStatus.filter(sim => sim.status === 'Installed').length;
        const notInstalledCount = simcardfinanceWithStatus.filter(sim => sim.status === 'Not Installed').length;
        res.status(200).send({ 
            success: true,
            installedCount,
            notInstalledCount,
            result,
            simcardfinanceWithStatus : simcardfinanceWithStatus,
            simcardfinanceresults,
            vehicleSim_Number
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
        const { sim, sim2 } = req.body;

        // Fetch vehicle Sim_Numbers
        const vehicleSim_NumberResults = await query("SELECT Sim_Number FROM vehicle");
        const vehicleSimNumbers = vehicleSim_NumberResults.map(vehicle => vehicle.Sim_Number);

        // Search simcardfinance by Sim_Numbers
        let sql = `SELECT * FROM SimCardFinance WHERE sim LIKE '%${sim}%' OR sim2 LIKE '%${sim2}%'`;
        const results = await query(sql);

        // Add status to each result based on Sim_Number match
        const resultsWithStatus = results.map(simcardfinance => ({
            ...simcardfinance,
            status: vehicleSimNumbers.includes(simcardfinance.sim) ? 'Installed' : 'Not Installed'
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
    getAllSimCardFinance,
    searchController,
}