var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Product = require('../models/product');

mongoose.connect('mongodb+srv://dbUser:dbUserPassword@wit-flowershop-cluster-7zj9e.mongodb.net/flowerdb?retryWrites=true&w=majority',
    {useNewUrlParser: true, useUnifiedTopology: true});

var db = mongoose.connection;

db.on('error', function (err) {
    console.log('connection error', err);
});
db.once('open', function () {
    console.log('connected to database');
});


router.get('/list', function(req, res) {
    Product.find(function(err, product) {
        if (err)
            res.send(err);
        else {
            res.json(product);
        }
    });
});

//use key word search - fuzzy search
router.post('/search', function(req, res) {
    const keyword = req.body.keyword;
    Product.find({productName:{$regex:keyword,$options:"$i"}},(err, docs) => {
        if(docs.length > 0) {
            res.json({isSuccess: true, message: '',data:docs})
        } else {
            res.json({isSuccess: false, message: 'no result'})
        }
    });
});
module.exports = router;
