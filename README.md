# Passwordless-TokenStore-Test

This module provides generic tests for the implementation of custom [TokenStores](https://github.com/florianheinemann/passwordless-tokenstore) for [Passwordless](https://github.com/florianheinemann/passwordless), a node.js module for express that allows website authentication without password using verification through email or other means.

## Usage

In the folder of your custom TokenStore implementation do:

`$ npm install passwordless-tokenstore-test --save-dev`

Afterwards, you can simply call the test suite as part of your other tests. For example: 

```javascript
var standardTests = require('passwordless-tokenstore-test');

function TokenStoreFactory() {
	return new YourTokenStore();
}

var beforeEachTest = function(done) {
	// clean database before usage
	done();
}

var afterEachTest = function(done) {
	// any other activity after each test
	done();
}

// Call the test suite
standardTests(TokenStoreFactory, beforeEachTest, afterEachTest);

describe('Your specific tests', function() {

	beforeEach(function(done) {
		beforeEachTest(done);
	})

	afterEach(function(done) {
		afterEachTest(done);
	})

	it('should...', function () {
		expect(...).to...
	})
})
```

## Parameter

The exported function has to be called with the following parameter:

```javascript
standardTests(TokenStoreFactory(), beforeEachTest(done), afterEachTest(done), [timeout]);
```

- TokenStoreFactory: has to provide a fresh instance of your TokenStore with each call
- beforeEachTest: will be called before each test of the standard test suite. Please make sure that you call done()
- afterEachTest: will be called after each test of the standard test suite. Please make sure that you call done()
- timeout (defaults to 200ms): The expected time it takes to store the data in the database in a typical test environment. A higher value will slow down your tests, but a too low value might result in failed tests due to data that is not yet written

All parameters are mandatory.

The test suite *expects* a clean state of the TokenStore (incl. the underlying database) for each test. You may use beforeEachTest to clean the state of the database.

## License

[MIT License](http://opensource.org/licenses/MIT)

## Author
Florian Heinemann [@thesumofall](http://twitter.com/thesumofall/)
