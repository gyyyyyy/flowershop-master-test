var Product = require('../models/product')
var Order = require('../models/order')

var express = require('express')
var router = express.Router()
var mongoose = require('mongoose')


mongoose.connect('mongodb://localhost:27017/flowerdb',
  {useNewUrlParser: true, useUnifiedTopology: true})

var db = mongoose.connection

db.on('error', function (err) {
  console.log('connection error', err)
})
db.once('open', function () {
  console.log('connected to database')
})

router.findAll = function(req, res) {
  Product.find(function(err, product) {
    if (err)
      res.send(err)
    else {
      res.json(product)
    }
  })
}

router.findOne = function(req, res) {
  Product.find({ '_id' : req.params.id },function(err, product) {
    if (err||product.length === 0)
      res.json({ message: 'Product NOT Found!', errmsg : err } )
    else
    //console.log(product.length)
    //console.log(typeof(product))
      res.json(product)
  })
}

router.addProduct = function(req, res) {

  var product = new Product()

  product.productId = req.body.productId
  product.productName = req.body.productName
  product.salePrice = req.body.salePrice
  product.productNum = req.body.productNum
  product.productImage = req.body.productImage
  // {"productId":"11","productName":"rose","salePrice":11,"productNum":11,"productImage":"dfsf/ss"}
  product.save(function(err) {
    if (err)
      res.send(err)

    res.json({ message: 'Product Added!', data: product })
  })
}

router.deleteProduct = function(req, res) {

  Product.findByIdAndRemove(req.params.id, function(err) {
    if (err)
      res.send({ message: 'Product NOT found!',errmsg : err})
    else
      res.json({ message: 'Product Deleted!'})
  })
}
router.editProduct = function(req, res) {
  Product.findById(req.params.id, function(err,product) {
    if (err)
      res.send(err)
    else {
      product.productId = req.body.productId
      product.productName = req.body.productName
      product.salePrice = req.body.salePrice
      product.productNum = req.body.productNum
      product.productImage = req.body.productImage
      product.save(function (err) {
        if (err)
          res.send(err)
        else
          res.json({ message: 'Product Updated!', data: product })
      })
    }
  })
}
router.findAllOrder = function(req, res) {
  Order.find(function(err, order) {
    if (err)
      res.send(err)
    else {

      res.json(order)
      
    }
  })
}

router.findOneOrder = function(req, res) {

  Order.find({ '_id' : req.params.id },function(err, order) {
    //console.log(order.length)
    //Object.keys(order)
    if (err||order.length === 0)
      res.json({ message: 'Order NOT Found!', errmsg : err } )
    else
      res.json(order)
    
  })
}

router.deleteOrder = function(req, res) {

  Order.findByIdAndRemove(req.params.id, function(err) {
    if (err){
      res.send({message: 'Order NOT Found!'})
    }
    else
      res.json({ message: 'Order Deleted!'})
  })
}

router.editOrder = function(req, res) {
  Order.findById(req.params.id, function(err,order) {
    if (err)
      res.json({ message: 'cannot edit!'})
    else {
      order.orderList = req.body.orderList
      order.userName = req.body.userName
      order.save(function (err) {
        if (err)
          res.json({ message: 'Order NOT Found!'})
        else
          res.json({ message: 'Order Updated!', data: order })
      })
    }
  })
}




module.exports = router
