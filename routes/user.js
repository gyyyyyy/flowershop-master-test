var express = require('express')
var User = require('../models/user')
var router = express.Router()
var sha1 = require('sha1')
var jwt = require('jsonwebtoken')
var config = require('../config')
var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/flowerdb',
  {useNewUrlParser: true, useUnifiedTopology: true})
//mongoose.connect('mongodb+srv://dbUser:dbUserPassword@wit-flowershop-cluster-7zj9e.mongodb.net/flowerdb?retryWrites=true&w=majority',
//{useNewUrlParser: true, useUnifiedTopology: true});

var db = mongoose.connection

db.on('error', function (err) {
  console.log('connection error', err)
})
db.once('open', function () {
  console.log('connected to database')
})

// Constant
const superSecret = config.superSecret

router.post('/register', function (req, res) {
  const newUser = new User({
    userName : req.body.userName,
    userPwd : sha1(req.body.userPwd),
    // status: req.body.status
  })
  const userName = req.body.userName
  User.find({userName: userName},(err, docs) => {
    if(docs.length > 0) {
      res.json({isSuccess: false, message: 'User already exists!'})
    } else {
      db.collection('order').insert({'userName':userName})
      newUser.save(err => {
        const datas =  err ? {isSuccess: false} : {isSuccess: true, message: 'Registered successfully',data:newUser}
        res.json(datas)
      })
    }
  })
})

//login
router.post('/login', function (req, res) {
  const userName = req.body.userName
  const userPwd = req.body.userPwd
  if (userName === undefined||'') {
    res.json({isSuccess: false, message: 'The username cannot be empty.'})
    return
  }
  if (userPwd === undefined||'') {
    res.json({isSuccess: false, message: 'The password cannot be empty'})
    return
  }
  User.find({userName: userName}, function (err, user) {
    if(user.length === 0) {
      res.json({isSuccess: false, message: 'User does not exist.'})
    } else if (user[0].userPwd === sha1(userPwd)) {
      // res.cookie("userName",userName,{
      //     path:'/',
      //     maxAge:1000*60*60
      // });
      let token = jwt.sign({userName: user.userName}, superSecret, {
        // 1 hour
        expiresIn: 3600
      })
      if (user[0].isAdmin === true){
        res.json({isSuccess: true, isAdmin: true, token:token,message: 'Log in successfully!'})
      }
      else{
        res.json({isSuccess: true, isAdmin: false,token:token,message: 'Log in successfully!'})
      }

    } else if (user[0].userPwd !== sha1(userPwd)) {
      res.json({isSuccess: false, message: 'Password is incorrect, please enter it again'})
    }
  })
})

// change password

router.put('/change', function (req, res) {
  res.setHeader('Content-Type', 'application/json')

  // jwt
  let token = req.body.token
  if (!token) {
    res.send({message: 'Not Login Yet, Please Login'})
  } else {
    jwt.verify(token, config.superSecret, (err, decoded) => {
      if (err) {
        res.send({message: 'error',errmsg:err})
      }
      else {
        req.decoded = decoded

        User.find({userName: req.body.userName}, (err, user) => {
          if (err) {
            res.send({message: 'error',errmsg:err})
          } else {
            if (user.length === 0) {
              res.send({message: 'The username is not registered'})
            } else {
              user = user[0]
              user.userPwd = req.body.userPwd ? sha1(req.body.userPwd) : user.userPwd
              user.save((err) => {
                if (err) {
                  res.send({message: 'error',errmsg:err})
                } else {
                  res.send({message: 'Successfully change password'})
                }
              })
            }
          }
        })
      }
    })
  }
})

router.get('/', function (req, res) {

  res.setHeader('Content-Type', 'application/json')

  User.find((err, user) => {
    if (err) {
      res.send(err)
    } else {
      res.json(user)
    }
  })
})


router.get('/:id', function (req, res) {
  res.setHeader('Content-Type', 'application/json')

  User.find({'_id': req.params.id}, (err, user) => {
    if (err||user.length===0) {
      res.json({ message: 'User NOT Found!', errmsg : err } )
    } else {
      res.json(user)
    }
  })
})
router.delete('/:id', function (req, res) {
  res.setHeader('Content-Type', 'application/json')

  // eslint-disable-next-line no-unused-vars
  User.findByIdAndRemove(req.params.id, (err, user) => {
    if (err) {
      res.send({ message: 'User NOT found!',errmsg : err})
    } else {
      res.json({ message: 'User Deleted!'})
    }
  })
})

module.exports = router
