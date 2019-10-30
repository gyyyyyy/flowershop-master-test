const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const Product = require('../../../models/product')
const mongoose = require('mongoose')

const _ = require('lodash')
let server
let mongod
let db, validID

describe('Product', () => {
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
      db = mongoose.connection
    } catch (error) {
      console.log(error)
    }
  })

  after(async () => {
    try {
      await db.dropDatabase()
    } catch (error) {
      console.log(error)
    }
  })

  beforeEach(async () => {
    try {
      await Product.deleteMany({})
      let product = new Product()
      product.productId ='11'
      product.productName='rose'
      product.salePrice=12
      product.productNum=1
      product.productImage='image/rose'
      product.checked='1'
      await product.save()
      product = new Product()
      product.productId ='12'
      product.productName='daisy'
      product.salePrice=18
      product.productNum=12
      product.productImage='image/daisy'
      product.checked='1'
      await product.save()
      product = await Product.findOne({ productName:'rose' })
      validID = product._id
    } catch (error) {
      console.log(error)
    }
  })

  describe('GET /admin/product', () => {
    it('should GET all the products', done => {
      request(server)
        .get('/admin/product')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          try {
            expect(res.body).to.be.a('array')
            expect(res.body.length).to.equal(2)
            let result = _.map(res.body, product => {
              return {
                productId :product.productId,
                productName:product.productName,
                salePrice:product.salePrice,
                productNum:product.productNum,
                productImage:product.productImage,
                checked:product.checked
              }
            })
            expect(result).to.deep.include({productId:'11',productName:'rose',salePrice:12,productNum:1,productImage:'image/rose',checked:'1'})
            expect(result).to.deep.include({productId:'12',productName:'daisy',salePrice:18,productNum:12,productImage:'image/daisy',checked:'1'})
            done()
          } catch (e) {
            done(e)
          }
        })
    }).timeout(5000)
  })

  describe('GET /admin/product/:id', () => {
    describe('when the id is valid', () => {
      it('should return the matching product', done => {
        request(server)
          .get(`/admin/product/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(res.body[0]).to.have.property('productName', 'rose')
            done(err)
          })
      })
    })
    describe('when the id is invalid', () => {
      it('should return the NOT found message', done => {
        request(server)
          .get('/admin/product/9999')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            expect(res.body.message).equals('Product NOT Found!')
            done(err)
          })
      })
    })
  })
  describe('DELETE /admin/product/:id', () => {
    describe('when the id is valid', () => {
      it('should return a message', done => {
        request(server)
          .delete(`/admin/product/${validID}`)
          .expect(200)
          .end((err,resp) => {
            expect(resp.body).to.include({
              message: 'Product Deleted!'
            })
            done(err)
          })
      })
      after(() => {
        return request(server)
          .get(`/admin/product/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            expect(res.body.message).equals('Product NOT Found!')
          })

      })
    })
    describe('when the id is invalid', () => {
      it('should return the NOT DELETED message', done => {
        request(server)
          .delete('/admin/product/9999')
          .expect(200)
        //.set("Accept", "application/json")
        //.expect("Content-Type", /json/)
          .end((err,resp) => {
            expect(resp.body).to.include({
              message: 'Product NOT found!'
            })
            done(err)
          })
      })
    })
  })  //end-DELETE
  describe('PUT /admin/product/:id', () => {
    describe('when the id is valid', () => {
      it('should update and return the matching product, return a message', () => {
        return request(server)
          .put(`/admin/product/${validID}`)
          .send({'productId':'10','productName':'rosemary','salePrice':22,'productNum':11,'productImage':'my/image'})
          .expect(200)
          .then(resp => {
            expect(resp.body).to.include({
              message: 'Product Updated!'
            })
            expect(resp.body.data).to.include({productId: '10',productName:'rosemary',salePrice:22,productNum:11,productImage:'my/image'})
          })
      })// test response
      after(() => {
        return request(server)
          .get(`/admin/product/${validID}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            expect(res.body[0]).to.have.property('productId', '10')
            expect(res.body[0]).to.have.property('productName', 'rosemary')
            expect(res.body[0]).to.have.property('salePrice', 22)
            expect(res.body[0]).to.have.property('productNum', 11)
            expect(res.body[0]).to.have.property('productImage', 'my/image')


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
  describe('POST /admin/product', () => {
    it('should return confirmation message and update datastore', () => {
      const product = {
        productId:'10',
        productName:'rosemary',
        salePrice:22,
        productNum:11,
        productImage:'my/image'

      }
      return request(server)
        .post('/admin/product')
        .send(product)
        .expect(200)
        .then(res => {
          expect(res.body.message).equals('Product Added!')
          validID = res.body.data._id
        })
    })
    after(() => {
      return request(server)
        .get(`/admin/product/${validID}`)
        .expect(200)
        .then(res => {
          expect(res.body[0]).to.have.property('productId', '10')
          expect(res.body[0]).to.have.property('productName', 'rosemary')
          expect(res.body[0]).to.have.property('salePrice', 22)
          expect(res.body[0]).to.have.property('productNum', 11)
          expect(res.body[0]).to.have.property('productImage', 'my/image')
        })
    })
  })
})
