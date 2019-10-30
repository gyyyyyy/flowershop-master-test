/*eslint no-unused-vars: "off" */
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var indexRouter = require('./routes/index')
var user = require('./routes/user.js')
var admin = require('./routes/admin.js')
var general = require('./routes/general.js')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))


// app.use(function(req,res,next){
//
//   if(req.cookies.userName){
//     next();
//   }else{
//     console.log("url:"+req.originalUrl);
//     if(req.originalUrl =='/user/login' || req.originalUrl == '/user/logout' ||req.originalUrl == '/user/register'|| req.originalUrl.indexOf("/general") != -1 || req.originalUrl.indexOf("/admin") != -1){
//     next();
//     }else{
//     res.json({
//       status:'1001',
//       msg:'Please log in',
//       result:''
//     })
//     }
//   }
// });



app.use('/', indexRouter)
app.use('/user', user)
app.use('/admin', admin)
app.use('/general', general)

app.get('/admin/product', admin.findAll)
app.get('/admin/product/:id', admin.findOne)
app.post('/admin/product', admin.addProduct)
app.delete('/admin/product/:id', admin.deleteProduct)
app.put('/admin/product/:id', admin.editProduct)
app.get('/admin/order', admin.findAllOrder)
app.get('/admin/order/:id', admin.findOneOrder)
app.delete('/admin/order/:id', admin.deleteOrder)
app.put('/admin/order/:id', admin.editOrder)



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
