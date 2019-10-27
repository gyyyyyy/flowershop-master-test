const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://dbUser:dbUserPassword@wit-flowershop-cluster-7zj9e.mongodb.net/flowerdb?retryWrites=true&w=majority");

var db = mongoose.connection;

db.on('error', function (err) {
    console.log('connection error', err);
});
db.once('open', function () {
    console.log('connected to database');
});