const express = require("express");
const { getAllClients, createClient, updateClient, deleteClient, searchController, getClientData } = require("../controllers/clientController");

// express router
const router = express.Router();
// get-all-client
router.get("/get-all-client" ,getAllClients);
// get-client-data
router.post("/get-client-data",  getClientData );
// create-complain
router.post("/create-client", createClient);
// update-complain
router.put("/update-client/:clientId", updateClient);
// delete-complain
router.delete("/delete-client/:clientId", deleteClient)
//search
router.post("/search",  searchController );

module.exports = router;
