const mongoose = require("mongoose");

const blacklistTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "Token is required to be added in blacklist."],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // ⏱️ 1 day (match JWT expiry)
  },
});

const tokenBlacklistModel = mongoose.model(
  "blacklistToken",
  blacklistTokenSchema,
);

module.exports = tokenBlacklistModel;
