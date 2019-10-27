var mongoose = require('mongoose');

var OrderSchema = new mongoose.Schema({
    "userName":String,
    "orderList":Array
},{ collection: 'order' });

module.exports = mongoose.model("Order",OrderSchema);