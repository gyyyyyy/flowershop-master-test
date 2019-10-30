const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;
const User = require("../../../models/user");
const mongoose = require("mongoose");
var sha1 = require('sha1')
const config = require('../../../config')

const _ = require("lodash");
let server;
let mongod;
let db, validID;
let username = 'gyy123'
let token
let superSecret = config.superSecret
describe("User", () => {
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
            token = jwt.sign({username: username}, superSecret, {
                // 1 hour
                expiresIn: 3600
            })
        } catch (error) {
            //console.log(error);
        }
    });

    after(async () => {
        try {
            await db.dropDatabase();
        } catch (error) {
            //console.log(error);
        }
    });
    beforeEach(async () => {
        try {
            await User.deleteMany({});
            let user = new User();
            user.userName ="gyy123";
            user.userPwd=sha1("123");
            user.isAdmin=false;
            await user.save();
            user = new User();
            user.userName ="chelsea";
            user.userPwd=sha1("456");
            user.isAdmin=false;
            await user.save();
            user = await User.findOne({ userName:"gyy123" });
            validID = user._id;
        } catch (error) {
            console.log(error);
        }
    });

    describe("GET /user", () => {
        it("should GET all users", done => {
            request(server)
                .get("/user")
                .set("Accept", "application/json")
                .expect("Content-Type", /json/)
                .expect(200)
                .end((err, res) => {
                    try {
                        expect(res.body).to.be.a("array");
                        expect(res.body.length).to.equal(2);
                        let result = _.map(res.body, user => {
                            return {
                                userName:user.userName,
                                userPwd:user.userPwd,
                                isAdmin:user.isAdmin
                            };
                        });
                        expect(result).to.deep.include({userName:"gyy123",userPwd:sha1("123"),isAdmin:false});
                        expect(result).to.deep.include({userName:"chelsea",userPwd:sha1("456"),isAdmin:false});
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        }).timeout(5000);
    });

    describe("GET /user/:id", () => {
        describe("when the id is valid", () => {
            it("should return the matching user", done => {
                request(server)
                    .get(`/user/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, res) => {
                        expect(res.body[0]).to.have.property("userName", "gyy123");
                        done(err);
                    });
            }).timeout(5000);
        });
        describe("when the id is invalid", () => {
            it("should return the NOT found message", done => {
                request(server)
                    .get("/user/9999")
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end((err, res) => {
                        expect(res.body.message).equals("User NOT Found!");
                        done(err);
                    });
            });
        });
    });
    
});
