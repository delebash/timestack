/* */ 
(function(process) {
  var levelup = require('../lib/levelup'),
      common = require('./common'),
      rimraf = require('rimraf'),
      async = require('async'),
      assert = require('referee').assert,
      refute = require('referee').refute,
      buster = require('bustermove');
  function makeTest(db, delay, done) {
    var i = 0,
        j = 0,
        k = 0,
        m = 0;
    var streamEnd = false,
        putEnd = false;
    db.createReadStream().on('data', function(data) {
      i++;
    }).on('end', function() {
      assert.equals(i, 0, 'stream read the future');
      if (putEnd)
        done();
      streamEnd = true;
    });
    db.on('put', function(key, value) {
      j++;
    });
    function insert() {
      m++;
      db.put('hello' + k++ / 10, k, next);
    }
    delay(function() {
      insert();
      insert();
      insert();
      insert();
      insert();
      insert();
      insert();
      insert();
      insert();
      insert();
    });
    function next() {
      if (--m)
        return;
      process.nextTick(function() {
        assert.equals(j, 10);
        assert.equals(i, 0);
        if (streamEnd)
          done();
        putEnd = true;
      });
    }
  }
  buster.testCase('ReadStream', {
    'setUp': common.readStreamSetUp,
    'tearDown': common.commonTearDown,
    'readStream and then put in nextTick': function(done) {
      this.openTestDatabase(function(db) {
        makeTest(db, process.nextTick, done);
      }.bind(this));
    },
    'readStream and then put in nextTick, defered open': function(done) {
      var location = common.nextLocation(),
          db = levelup(location);
      this.closeableDatabases.push(db);
      this.cleanupDirs.push(location);
      makeTest(db, process.nextTick, done);
    },
    'readStream and then put, defered open': function(done) {
      var location = common.nextLocation(),
          db = levelup(location);
      this.closeableDatabases.push(db);
      this.cleanupDirs.push(location);
      makeTest(db, function(f) {
        f();
      }, done);
    },
    'readStream and then put': function(done) {
      this.openTestDatabase(function(db) {
        makeTest(db, function(f) {
          f();
        }, done);
      }.bind(this));
    }
  });
})(require('process'));