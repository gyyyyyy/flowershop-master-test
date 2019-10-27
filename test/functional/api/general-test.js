const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;
const Product = require("../../../models/product");
const mongoose = require("mongoose");

const _ = require("lodash");
let server;
let mongod;
let db, validID;

describe("General", () => {
    before(async () => {
        try {
            mongod = new MongoMemoryServer({
                instance: {
                    port: 27017,
                    dbPath: "./test/database",
                    dbName: "flowerdb" // by default generate random dbName
                }
            });
            // Async Trick - this ensures the database is created before
            // we try to connect to it or start the server
            await mongod.getConnectionString();

            mongoose.connect("mongodb://localhost:27017/flowerdb", {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            server = require("../../../bin/www");
            db = mongoose.connection;
        } catch (error) {
            console.log(error);
        }
    });

    after(async () => {
        try {
            await db.dropDatabase();
        } catch (error) {
            console.log(error);
        }
    });
    beforeEach(async () => {
        try {
            await Product.deleteMany({});
            let product = new Product();
            product.productId ="11";
            product.productName="rose";
            product.salePrice=12;
            product.productNum=1;
            product.productImage="image/rose";
            product.checked="1";
            await product.save();
            product = new Product();
            product.productId ="12";
            product.productName="rosemary";
            product.salePrice=18;
            product.productNum=12;
            product.productImage="image/rosemary";
            product.checked="1";
            await product.save();
            product = await Product.findOne({ productName:"rose" });
        } catch (error) {
            console.log(error);
        }
    });

    describe("GET /general/list", () => {
        it("should GET all the products", done => {
            request(server)
                .get("/general/list")
                .set("Accept", "application/json")
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, res) => {
                    try {
                        expect(res.body).to.be.a("array");
                        //expect(res.body.length).to.equal(2);
                        let result = _.map(res.body, product => {
                            return {
                                productId :product.productId,
                                productName:product.productName,
                                salePrice:product.salePrice,
                                productNum:product.productNum,
                                productImage:product.productImage,
                                checked:product.checked
                            };
                        });
                        expect(result).to.deep.include({productId:"11",productName:"rose",salePrice:12,productNum:1,productImage:"image/rose",checked:"1"});
                        expect(result).to.deep.include({productId:"12",productName:"rosemary",salePrice:18,productNum:12,productImage:"image/rosemary",checked:"1"});
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        }).timeout(5000);
    });
    describe("POST /general/search", () => {
        describe("when the keyword is valid", () => {
            it("should GET all matching products", done => {
                const keyword = {keyword:"rose"};
                request(server)
                    .post("/general/search")
                    .send(keyword)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, res) => {
                        try {
                            expect(res.body.data).to.be.a("array");
                            expect(res.body.data.length).to.equal(2);
                            let result = _.map(res.body.data, product => {
                                return {
                                    productId :product.productId,
                                    productName:product.productName,
                                    salePrice:product.salePrice,
                                    productNum:product.productNum,
                                    productImage:product.productImage,
                                    checked:product.checked
                                };
                            });
                            expect(result).to.deep.include({productId:"11",productName:"rose",salePrice:12,productNum:1,productImage:"image/rose",checked:"1"});
                            expect(result).to.deep.include({productId:"12",productName:"rosemary",salePrice:18,productNum:12,productImage:"image/rosemary",checked:"1"});
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            }).timeout(5000);
        });
        describe("when the keyword is valid", () => {
            it("should return no result", done => {
                const keyword = {keyword:"hello"};
                request(server)
                    .post("/general/search")
                    .send(keyword)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err,resp) => {
                        expect(resp.body).to.include({
                            message: 'no result'
                        });
                        done(err);
                    });
            }).timeout(5000);

        });

    });

});
