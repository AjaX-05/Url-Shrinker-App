const mongoose = require("mongoose");
const shortid = require("shortid");

const shrinkerSchema = new mongoose.Schema({
  fullUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    default: shortid.generate,
  },
  clicks: {
    type: Number,
    default: 0,
  },
});

const Shrinker = mongoose.model("Shrinker", shrinkerSchema);

module.exports = Shrinker;
