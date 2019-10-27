var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    "userName":String,
    "userPwd":String,
    "isAdmin":{
        type: Boolean,
        default: false
    }
}, { collection: 'user' });

module.exports = mongoose.model("User",UserSchema);