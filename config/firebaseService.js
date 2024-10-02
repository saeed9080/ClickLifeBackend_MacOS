var admin = require("firebase-admin");
var serviceAccount = require("../clicklife-fa926-firebase-adminsdk-wr1lz-997de89d29.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// export
module.exports = admin;
