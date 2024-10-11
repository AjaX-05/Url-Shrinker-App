const mongoose = require("mongoose");

const authSchema = new mongoose.Schema({
  accessToken: {
    type: String,
    require: true,
  },
  refreshToken: {
    type: String,
  },
});

const Auth = mongoose.model("Auth", authSchema);

module.exports = Auth;
