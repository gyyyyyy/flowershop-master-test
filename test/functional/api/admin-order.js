const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const Order = require('../../../models/order')
const mongoose = require('mongoose')

const _ = require('lodash')
let server
let mongod
let dbtemp, validID

describe('Order', () => {
  before(async () => {
    try {
      mongod = new MongoMemoryServer({debug:true},{
        instance: {
          port: 27017,
          dbPath: './test/database',
          dbName: 'flowerdb' // by default generate random dbName
        }
      })
      // Async Trick - this ensures the database is created before
      // we try to connect to it or start the server
      await mongod.getConnectionString()

      mongoose.connect('mongodb://localhost:27017/flowerdb', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      server = require('../../../bin/www')
      dbtemp = mongoose.connection
    } catch (error) {
      console.log(error)
    }
  })

  after(async () => {
    try {
      await dbtemp.dropDatabase()
    } catch (error) {
      console.log(error)
    }
  })

  beforeEach(async () => {
    try {
      await Order.deleteMany({})
      let order = new Order()
      order.userName = 'gyy123'
      order.orderList =  [{productId:'11',productName:'rose',salePrice:12,productNum:1,productImage:'image/rose',checked:'1'}]
      order.save()
      order = new Order()
      order.userName = 'gyy1234'
      order.orderList = [{productId:'12',productName:'daisy',salePrice:18,productNum:3,productImage:'image/daisy',checked:'1'}]
      await order.save()
      order = await Order.findOne({ userName:'gyy123' })
      validID = order._id
    } catch (error) {
      console.log(error)
    }
  })

  describe('GET /admin/order', () => {
    it('should GET all the orders', done => {
      request(server)
        .get('/admin/order')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          try {
            expect(res.body).to.be.a('array')
            expect(res.body.length).to.equal(2)
            let result = _.map(res.body, order => {
              return {
                userName: order.userName,
                orderList: order.orderList
              }
            })
            expect(result).to.deep.include({userName: 'gyy123',
              orderList:[{productId:'11',productName:'rose',salePrice:12,productNum:1,productImage:'image/rose',checked:'1'}]
            })
            expect(result).to.deep.include({userName: 'gyy1234',
              orderList:[{productId:'12',productName:'daisy',salePrice:18,productNum:3,productImage:'image/daisy',checked:'1'}]
            })
            done()
          } catch (e) {
            done(e)
          }
        })
    }).timeout(5000)
  })
  describe('GET /admin/order/:id', () => {
    describe('when the id is valid', () => {
      it('should return the matching order', done => {
        request(server)
          .get(`/admin/order/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(res.body[0]).to.have.property('userName', 'gyy123')
            done(err)
          })
      })
    })
    describe('when the id is invalid', () => {
      it('should return the NOT found message', done => {
        request(server)
          .get('/admin/order/9999')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(res.body.message).equals('Order NOT Found!')
            done(err)
          })
      })
    })
  })
  describe('DELETE /admin/order/:id', () => {
    describe('when the id is valid', () => {
      it('should return a message', done => {
        request(server)
          .delete(`/admin/order/${validID}`)
          .expect(200)
          .end((err,resp) => {
            expect(resp.body).to.include({
              message: 'Order Deleted!'
            })
            done(err)
          })
      })
      after(() => {
        return request(server)
          .get(`/admin/order/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res.body.message).equals('Order NOT Found!')
          })

      })
    })
    describe('when the id is invalid', () => {
      it('should return the NOT DELETED message', done => {
        request(server)
          .delete('/admin/order/9999')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err,resp) => {
            expect(resp.body).to.include({
              message: 'Order NOT Found!'
            })
            done(err)
          })
      })
    })
  })  //end-DELETE
  describe('PUT /admin/order/:id', () => {
    describe('when the id is valid', () => {
      it('should update and return the matching order, return a message', () => {
        return request(server)
          .put(`/admin/order/${validID}`)
          .send({'userName': 'gyy1234567',
            'orderList':[{'productId':'13','productName':'daisy','salePrice':18,'productNum':3,'productImage':'image/daisy','checked':'1'}]
          })
          .expect(200)
          .then(resp => {
            expect(resp.body).to.include({
              message: 'Order Updated!'
            })
            expect(resp.body.data).to.include({userName: 'gyy1234567'})
          })
      })// test response
      after(() => {
        return request(server)
          .get(`/admin/order/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            expect(res.body[0]).to.have.property('userName', 'gyy1234567')
            expect(res.body[0].orderList[0]).to.have.property('productId', '13')
            expect(res.body[0].orderList[0]).to.have.property('productName', 'daisy')
            expect(res.body[0].orderList[0]).to.have.property('salePrice', 18)
            expect(res.body[0].orderList[0]).to.have.property('productNum', 3)
            expect(res.body[0].orderList[0]).to.have.property('productImage', 'image/daisy')
            expect(res.body[0].orderList[0]).to.have.property('checked', '1')


          })
      })// test state of datastore
    })
    describe('when the id is invalid', () => {
      it('should return a NOT Found message', () => {
        return request(server)
          .put('/admin/order/1100001')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ message: 'cannot edit!' })
      })
    })
  })  // end-PUT
})
