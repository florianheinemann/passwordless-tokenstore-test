'use strict';

var expect = require('chai').expect;
var TokenStore = require('passwordless-tokenstore');
var uuid = require('node-uuid');
var chance = new require('chance')();

module.exports = function(TokenStoreFactory, beforeEachTest, afterEachTest) {
	describe('General TokenStore tests (no need to modify)', function() {

		beforeEach(function(done) {
			beforeEachTest(done);
		})

		afterEach(function(done) {
			afterEachTest(done);
		})

		describe('Tests', function() {
			it('should be an instance of TokenStore', function () {
				expect(TokenStoreFactory() instanceof TokenStore).to.be.true;
			})

			describe('storeOrUpdate()', function() {
				it('should allow the storage of a new token', function () {
					expect(function() { TokenStoreFactory().storeOrUpdate(uuid.v4(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {}) }).to.not.throw;
				})

				it('should allow the update of details if the same UID is provided', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token1 = uuid.v4(), token2 = uuid.v4();
					// Storage of first token for uid
					store.storeOrUpdate(token1, uid, 
						1000*60, 'http://www.example.com/alice', function() {
							expect(arguments.length).to.equal(0);

							// Update of uid with new details (incl. new token)
							store.storeOrUpdate(token2, uid, 
								1000*60, 'http://www.example.com/tom', function() {
									expect(arguments.length).to.equal(0);

									// the old token should not be valid anymore
									store.authenticate(token1, uid, function(err, valid, ret_ref) {
										expect(err).to.not.exist;
										expect(valid).to.equal(false);
										expect(ret_ref).to.not.exist;

										// but the new token should be valid and also return the new referrer
										store.authenticate(token2, uid, function(err, valid, ret_ref) {
											expect(err).to.not.exist;
											expect(valid).to.equal(true);
											expect(ret_ref).to.equal('http://www.example.com/tom')
											done();
										});
									})
								})
						});
				})

				it('should return an error in the format of callback(error) in case of duplicate tokens', function (done) {
					var store = TokenStoreFactory();
					var token = uuid.v4();
					store.storeOrUpdate(token, chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {
							expect(arguments.length).to.equal(0);

							store.storeOrUpdate(token, chance.email(), 
								1000*60, 'http://' + chance.domain() + '/page.html', function() {
									expect(arguments.length).to.equal(1);
									done();
								})
						});

				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.storeOrUpdate('', chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {})}).to.throw(Error);
					expect(function() { store.storeOrUpdate(uuid.v4(), '', 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {})}).to.throw(Error);
					expect(function() { store.storeOrUpdate(uuid.v4(), chance.email(), 
						'', 'http://' + chance.domain() + '/page.html', function() {})}).to.throw(Error);
					expect(function() { store.storeOrUpdate(uuid.v4(), chance.email(), 
						1000*60, '', function() {})}).to.not.throw();
					expect(function() { store.storeOrUpdate(uuid.v4(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html')}).to.throw(Error);
				})

				it('should callback in the format of callback() in case of success', function (done) {
					TokenStoreFactory().storeOrUpdate(uuid.v4(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {
							expect(arguments.length).to.equal(0);
							done();
						});
				})
			})

			describe('authenticate()', function() {
				it('should allow the authentication of a token / uid combination', function () {
					expect(function() { TokenStoreFactory().authenticate(uuid.v4(), chance.email(),
						 function() {}) }).to.not.throw;
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.authenticate('', chance.email(), function() {})}).to.throw(Error);
					expect(function() { store.authenticate(uuid.v4(), '', function() {})}).to.throw(Error);
					expect(function() { store.authenticate(uuid.v4(), chance.email()) }).to.throw(Error);
					expect(function() { store.authenticate(uuid.v4()) }).to.throw(Error);
				})

				it('should not authenticate a valid token for the wrong uid: callback(null, false, null)', function (done) {
					var store = TokenStoreFactory();
					var uid1 = chance.email(), uid2 = chance.email();
					var token1 = uuid.v4(), token2 = uuid.v4();
					var ref1 = 'http://www.example.com/path', ref2 = 'http://www.example.com/other';

					store.storeOrUpdate(token1, uid1, 
						1000*60, ref1, function() {
							expect(arguments.length).to.equal(0);

							store.storeOrUpdate(token2, uid2, 
								1000*60, ref2, function() {
									expect(arguments.length).to.equal(0);

									store.authenticate(token1, uid2, function(err, valid, ret_ref) {
										expect(err).to.not.exist;
										expect(valid).to.equal(false);
										expect(ret_ref).to.not.exist;
										done();
									})
								})
						});
				})

				it('should callback in the format of callback(null, true, referrer) in case of success', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid.v4();
					var ref = 'http://www.example.com/path';

					store.storeOrUpdate(token, uid, 
						1000*60, ref, function() {
							expect(arguments.length).to.equal(0);

							store.authenticate(token, uid, function(err, valid, ret_ref) {
								expect(err).to.not.exist;
								expect(valid).to.equal(true);
								expect(ret_ref).to.equal(ref);
								done();
							})
						});
				})

				it('should callback with callback(null, false, null) in case of an unknown token / uid', function (done) {
					TokenStoreFactory().authenticate(uuid.v4(), chance.email(), function(err, valid, ret_ref) {
							expect(err).to.not.exist;
							expect(valid).to.equal(false);
							expect(ret_ref).to.not.exist;
							done();
						});
				})
			})

			describe('invalidateToken()', function() {
				it('should fail silently for tokens that do not exist', function (done) {
					var store = TokenStoreFactory();
					store.invalidateToken(uuid.v4(), function(err) {
						expect(err).to.not.exist;
						done();
					});
				})

				it('should invalidate an existing token', function (done) {
					var store = TokenStoreFactory();
					var token = uuid.v4();
					var uid = chance.email();
					store.storeOrUpdate(token, uid, 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {
							store.invalidateToken(token, function(err) {
								expect(err).to.not.exist;
								store.authenticate(token, uid, function(err, valid, ref) {
									expect(err).to.not.exist;
									expect(valid).to.equal(false);
									expect(ref).to.not.exist;
									done();
								})
							})
						})
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.invalidateToken('test')}).to.throw(Error);
					expect(function() { store.invalidateToken()}).to.throw(Error);
				})
			})

			describe('invalidateUser()', function() {
				it('should fail silently for uids that do not exist', function (done) {
					var store = TokenStoreFactory();
					store.invalidateUser(chance.email(), function(err) {
						expect(err).to.not.exist;
						done();
					});
				})

				it('should invalidate an existing user', function (done) {
					var store = TokenStoreFactory();
					var token = uuid.v4();
					var uid = chance.email();
					store.storeOrUpdate(token, uid, 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {
							store.invalidateUser(uid, function(err) {
								expect(err).to.not.exist;
								store.authenticate(token, uid, function(err, valid, ref) {
									expect(err).to.not.exist;
									expect(valid).to.equal(false);
									expect(ref).to.not.exist;
									done();
								})
							})
						})
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.invalidateUser(chance.email())}).to.throw(Error);
					expect(function() { store.invalidateUser()}).to.throw(Error);
				})
			})

			describe('clear()', function() {
				it('should remove all data', function (done) {
					var store = TokenStoreFactory();
					store.storeOrUpdate(uuid.v4(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {	
						store.storeOrUpdate(uuid.v4(), chance.email(), 
							1000*60, 'http://' + chance.domain() + '/page.html', function() {
							store.clear(function() {
								expect(arguments.length).to.equal(0);
								store.length(function(err, length) {
									expect(err).to.not.exist;
									expect(length).to.equal(0);
									done();
								})
							})	
						})
					})
				})

				it('should throw exceptions for missing data', function () {
					var store = TokenStoreFactory();
					expect(function() { store.clear()}).to.throw(Error);
				})
			})

			describe('length()', function() {
				it('should return 0 for an empty TokenStore', function (done) {
					var store = TokenStoreFactory();
					store.length(function(err, count) {
						expect(count).to.equal(0);
						done();
					});
				})

				it('should return 2 after 2 tokens have been stored', function (done) {
					var store = TokenStoreFactory();
					store.storeOrUpdate(uuid.v4(), chance.email(), 
						1000*60, 'http://' + chance.domain() + '/page.html', function() {
							store.storeOrUpdate(uuid.v4(), chance.email(), 
								1000*60, 'http://' + chance.domain() + '/page.html', function() {
									store.length(function(err, count) {
										expect(count).to.equal(2);
										done();
									});
								})
						});
				})
			})

			describe('flow', function() {
				it('should validate an existing token / uid combination', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid.v4();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 1000*60, referrer, function() {
						expect(arguments.length).to.equal(0);
						store.authenticate(token, uid, function(error, valid, ref) {
							expect(valid).to.equal(true);
							expect(ref).to.equal(referrer);
							expect(error).to.not.exist;
							done()
						})
					})
				})

				it('should validate an existing token / uid several times if still valid', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid.v4();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 1000*60, referrer, function() {
						expect(arguments.length).to.equal(0);
						store.authenticate(token, uid, function(error, valid, ref) {
							expect(valid).to.equal(true);
							expect(ref).to.equal(referrer);
							expect(error).to.not.exist;

							store.authenticate(token, uid, function(error, valid, ref) {
								expect(valid).to.equal(true);
								expect(ref).to.equal(referrer);
								expect(error).to.not.exist;
								done();
							})
						})
					})
				})

				it('should not validate a not existing token / uid combination', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid.v4();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 1000*60, referrer, function() {
						expect(arguments.length).to.equal(0);
						store.authenticate(uuid.v4(), uid, function(error, valid, ref) {
							expect(valid).to.equal(false);
							expect(ref).to.not.exist;
							expect(error).to.not.exist;
							done();
						})
					})
				})

				it('should not validate a token / uid combination which time has run up', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid.v4();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 100, referrer, function() {
						expect(arguments.length).to.equal(0);

						setTimeout(function() {
							store.authenticate(token, uid, function(error, valid, ref) {
								expect(valid).to.equal(false);
								expect(ref).to.not.exist;
								expect(error).to.not.exist;
								done();
							})					
						}, 200);
					})
				})

				it('should validate token/uid if still valid, but not validate anymore if time has run up', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token = uuid.v4();
					var referrer = 'http://' + chance.domain() + '/page.html';
					store.storeOrUpdate(token, uid, 100, referrer, function() {
						expect(arguments.length).to.equal(0);

						store.authenticate(token, uid, function(error, valid, ref) {
							expect(valid).to.equal(true);
							expect(ref).to.equal(referrer);
							expect(error).to.not.exist;

							setTimeout(function() {
								store.authenticate(token, uid, function(error, valid, ref) {
									expect(valid).to.equal(false);
									expect(ref).to.not.exist;
									expect(error).to.not.exist;
									done();
								})					
							}, 200);
						})
					})
				})

				it('should allow the extension of time for a token/uid combination', function (done) {
					var store = TokenStoreFactory();
					var uid = chance.email();
					var token1 = uuid.v4(), token2 = uuid.v4();
					var referrer = 'http://' + chance.domain() + '/page.html';
					// First storage of a token for uid
					store.storeOrUpdate(token1, uid, 100, referrer, function(err) {
						expect(err).to.not.exist;

						// should authenticate
						store.authenticate(token1, uid, function(error, valid, ref) {
							expect(valid).to.equal(true);
							expect(ref).to.equal(referrer);
							expect(error).to.not.exist;

							// update of uid token with a new one, which is valid for much longer
							store.storeOrUpdate(token2, uid, 1000*60, referrer, function(err) {
								expect(err).to.not.exist;

								// authenticate with the new token after 200ms which is beyond the validity of token1
								setTimeout(function() {
									store.authenticate(token2, uid, function(error, valid, ref) {
										expect(valid).to.equal(true);
										expect(ref).to.equal(referrer);
										expect(error).to.not.exist;

										// ... but token1 shouldn't work anymore
										store.authenticate(token1, uid, function(error, valid, ref) {
											expect(valid).to.equal(false);
											expect(ref).to.not.exist;
											expect(error).to.not.exist;
											done();
										})	
									})					
								}, 200);
							})
						})
					})
				})
			})
		})
	})
};