var mongoose = require('mongoose')

var ProdutSchema = new mongoose.Schema({
    "productId":{type:String},
    "productName":String,
    "salePrice":Number,
    "checked":String,
    "productNum":Number,
    "productImage":String
},{ collection: 'product' });

module.exports = mongoose.model('Product',ProdutSchema);
