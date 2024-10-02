const query = require("../config/db")

// get all client

const getAllClients = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;

        // Query to get client details
        const clientQuery = `SELECT * FROM client ORDER BY id DESC`;
        const clientresult = await query(clientQuery);

        // Query to get clients with pagination
        const paginatedClientQuery = `SELECT * FROM client LIMIT ${limit} OFFSET ${offset}`;
        const result = await query(paginatedClientQuery);

        // Query to get the count of vehicles for each client
        const vehicleCountQuery = `
            SELECT c.id, c.Namee, COUNT(v.id) AS vehicle_count
            FROM client c
            LEFT JOIN vehicle v ON c.Namee = v.Client
            GROUP BY c.id, c.Namee
        `;
        const vehicleCounts = await query(vehicleCountQuery);

        // Map vehicle counts to the respective clients
        const clientsWithVehicleCounts = clientresult.map(client => {
            const vehicleCount = vehicleCounts.find(vc => vc.id === client.id);
            return {
                ...client,
                vehicle_count: vehicleCount ? vehicleCount.vehicle_count : 0,
            };
        });

        res.status(200).send({
            success: true,
            result,
            clientresult: clientsWithVehicleCounts,
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
        const results = await query("SELECT Namee FROM client");
        res.status(200).json({
            success: true,
            message: "Get Client Data Successfully!",
            result: results
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        })
    }
};

// create client

const createClient = async (req, res) => {
    try {
        // Constructing the client object with the fetched data
        const clientData = {
            ...req.body, // Include other fields from the request body
        };
        // Inserting the client into the client table
        const result = await query("INSERT INTO client SET ?", clientData);
        res.status(200).send({
            success: true,
            message: "Create Client Successfully!",
            result,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};


// update client

const updateClient = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const updatedClientData = req.body; // Get updated client data from request body
        const result = await query("UPDATE client SET ? WHERE id = ?", [updatedClientData, clientId]);
        res.status(200).send({
            success: true,
            message: "Client Updated Successfully!",
            result,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

// delete client

const deleteClient = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const results = await query('DELETE FROM client WHERE id = ?', [clientId]);
        res.status(200).send({
            success: true,
            message: "Client Delete Successfully!",
            results,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
}

// searchController 

const searchController = async (req, res) => {
    try {
        const { Namee, Email } = req.body;

        // Prevent SQL injection by using parameterized queries
        const sql = `
            SELECT c.*, COUNT(v.id) AS vehicle_count
            FROM client c
            LEFT JOIN vehicle v ON c.Namee = v.Client
            WHERE c.Namee LIKE ? OR c.Email LIKE ?
            GROUP BY c.id
        `;

        // Use wildcards for LIKE clause
        const queryParams = [`%${Namee}%`, `%${Email}%`];

        const results = await query(sql, queryParams);

        res.status(200).json({
            success: true,
            message: "Search results",
            total_client_length: results.length,
            result: results
        });
    } catch (error) {
        console.error('Error searching clients:', error); // Improved error logging
        res.status(500).send({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAllClients,
    createClient,
    updateClient,
    deleteClient,
    searchController,
    getClientData,
}