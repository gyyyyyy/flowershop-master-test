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
    describe("DELETE /user/:id", () => {
        describe("when the id is valid", () => {
            it("should return a message", done => {
                request(server)
                    .delete(`/user/${validID}`)
                    .expect(200)
                    .end((err,resp) => {
                        expect(resp.body).to.include({
                            message: 'User Deleted!'
                        });
                        done(err);
                    });
            });
            after(() => {
                return request(server)
                    .get(`/user/${validID}`)
                    .set("Accept", "application/json")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.message).equals("User NOT Found!");
                    })

            });
        });
        describe("when the id is invalid", () => {
            it("should return the NOT DELETED message", done => {
                request(server)
                    .delete("/user/9999")
                    .expect(200)
                    //.set("Accept", "application/json")
                    //.expect("Content-Type", /json/)
                    .end((err,resp) => {
                        expect(resp.body).to.include({
                            message: 'User NOT found!'
                        });
                        done(err);
                    });
            });
        });
    });  //end-DELETE

    describe('POST /user/login', () => {
        describe('when the username is not registered', () => {
            it('should return a message the username is not registered', () => {
                let user = {}
                user.username = 'sssdf'
                user.password = '123'
                return request(server)
                    .post('/user/login')
                    .send(user)
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.message).equals('User does not exist.')
                    })
                    .catch((err) => {
                        //console.log(err)
                    })
            })
        })
        describe('when the username is registered', () => {
            describe('when the password is wrong', () => {
                it('should return a message the password is wrong', () => {
                    let user = {}
                    user.username = 'gyy123'
                    user.password = '12345'
                    return request(server)
                        .post('/user/login')
                        .send(user)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.message).equals('Password is incorrect, please enter it again')
                        })
                        .catch((err) => {
                            //console.log(err)
                        })
                })
            })
            describe('when the password is correct', () => {
                it('should return a token and a message showing successfully login', () => {
                    let user = {}
                    user.username = 'gyy123'
                    user.password = sha1('123')
                    return request(server)
                        .post('/user/login')
                        .send(user)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.message).equals('Log in successfully!')
                        })
                        .catch((err) => {
                            //console.log(err)
                        })
                })
            })
        })
    })    describe('POST /user/register', () => {
        describe('when the username is already in database', () => {
            it('should return a message to inform the duplication', () => {
                let user = {}
                user.username = 'gyy123'
                user.password = '123'
                return request(server)
                    .post('/user/register')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .send(user)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.message).equals('User already exists!')
                    })
                    .catch((err) => {
                        //console.log(err)
                    })
            })
        })
        describe('when the username is new', () => {
            it('should return a message of successfully add user', () => {
                let user = {}
                user.username = 'user'
                user.password = '123'
                return request(server)
                    .post('/user/register')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .send(user)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.message).equals('Registered successfully')
                    })
                    .catch((err) => {
                        //console.log(err)
                    })
            })
            after(() => {
                return request(server)
                    .get('/user')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.data.length).to.equal(3)
                        let result = _.map(res.body.data, (user) => {
                            return {
                                username: user.username
                            }
                        })
                        expect(result).to.deep.include({
                            username: 'user'
                        })
                    })
                    .catch((err) => {
                        //console.log(err)
                    })
            })
        })
    })
    describe('PUT /user/change', () => {
        describe('when there is no jwt token', () => {
            it('should require to login if it does not have a jwt token',  () => {
                let user = {}
                user.userName = 'gyy123'
                user.userPwd = sha1("123");
                return request(server)
                    .put('/user/change')
                    .send(user)
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then((res) => {
                        expect(res.body.message).equals('Not Login Yet, Please Login')
                    })
                    .catch((err) => {
                        //console.log(err)
                    })
            })
        })
        describe('when there is a jwt token', () => {
            describe('when the token is invalid', () => {
                it('should return an invalid error', () => {
                    let user = {}
                    user.token = '123'
                    user.username = 'gyy123'
                    user.password = '123'
                    return request(server)
                        .put('/user/change')
                        .send(user)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .then((res) => {
                            expect(res.body.errmsg.name).equals('JsonWebTokenError')
                        })
                        .catch((err) => {
                            //console.log(err)
                        })
                })
            })
            describe('when the token is valid', () => {
                describe('when the username is not registered', () => {
                    it('should return a message the username is not registered', () => {
                        let user = {}
                        user.token = token
                        user.username = 'shenmewanyi'
                        user.password = 'shenmewanyi'

                        return request(server)
                            .put('/user/change')
                            .send(user)
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.message).equals('The username is not registered')
                            })
                            .catch((err) => {
                                //console.log(err)
                            })
                    })
                })
                describe('when the username is registered', () => {
                    it('should return a message of successfully update user', () => {
                        let user = {}
                        user.token = token
                        user.username = 'gyy123'
                        user.password = '123'
                        return request(server)
                            .put('/user/change')
                            .send(user)
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .then((res) => {
                                expect(res.body.message).equals('Successfully change password')
                            })
                            .catch((err) => {
                                //console.log(err)
                            })
                    })
                    after(() => {
                        return request(server)
                            .get(`/user/${validID}`)
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .then(res => {
                                expect(res.body[0]).to.have.property("userName", "gyy123");
                                expect(res.body[0]).to.have.property("userPwd", sha1("123"));
                            })
                            .catch((err) => {
                                //console.log(err)
                            })
                    })
                })
            })
        })
    })
});
