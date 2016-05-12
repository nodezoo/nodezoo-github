'use strict'

var Lab = require('lab')
var Code = require('code')
var Proxyquire = require('proxyquire')
var NpmFakeData = require('./npm-data')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var NpmProxy = {
  request: {
    get: (opts, done) => {
      if (opts.url.includes('seneca')) {
        done(null, {}, JSON.stringify(NpmFakeData))
      }
      else {
        done(new Error('npm error'), null, null)
      }
    }
  }
}


var Seneca = Proxyquire('seneca', {})
var Github = Proxyquire('..', NpmProxy)

function createInstance (done) {
  var params = {
    log: 'silent',
    strict: 'false',
    errhandler: (err) => {
      if (err.at) done(err)
    }
  }

  return Seneca(params)
    .use('entity')
    .use(Github, {token: process.env.GITHUB_TOKEN})
}

describe('A valid "role:github,cmd:get" call', () => {
  it('has data and no error', (done) => {
    var seneca = createInstance(done)
    var payload = {name: 'seneca'}

    seneca.act('role:github,cmd:get', payload, (err, reply) => {
      expect(err).to.not.exist()
      expect(reply).to.exist()
      done()
    })
  })

  it('returns cached data', (done) => {
    var seneca = createInstance(done)
    var payload = {name: 'seneca'}

    seneca.act('role:github,cmd:get', payload, (err, reply) => {
      expect(err).to.not.exist()

      var cachedOne = reply.cached

      seneca.act('role:github,cmd:get', payload, (err, reply) => {
        expect(err).to.not.exist()

        var cachedTwo = reply.cached

        expect(cachedOne).to.equal(cachedTwo)
        done()
      })
    })
  })

  it('can return non-cached data', (done) => {
    var seneca = createInstance(done)
    var payload = {name: 'seneca'}

    seneca.act('role:github,cmd:get', payload, (err, reply) => {
      expect(err).to.not.exist()

      var cachedOne = reply.data.cached
      payload.update = true

      seneca.act('role:github,cmd:get', payload, (err, reply) => {
        expect(err).to.not.exist()

        var cachedTwo = reply.data.cached

        expect(cachedOne).to.be.below(cachedTwo)
        done()
      })
    })
  })
})

describe('An invalid "role:github,cmd:get" call', () => {
  it('has an error and no data', (done) => {
    var seneca = createInstance(done)
    var payload = {name: 'shooobydoobydooboop'}

    seneca.act('role:github,cmd:get', payload, (err, reply) => {
      expect(err).to.exist()
      expect(reply).to.not.exist()
      done()
    })
  })
})

describe('A valid "role:info,req:part" call', () => {
  it('has no error and has data', (done) => {
    var seneca = createInstance(done)
    var payload = {name: 'seneca'}

    seneca.act('role:info,req:part', payload, (err, reply) => {
      expect(err).to.not.exist()
      expect(reply).to.exist()
      done()
    })
  })

  it('responds via "role:info,res:part"', (done) => {
    var seneca = createInstance(done)
    var payload = {name: 'seneca'}

    seneca.add('role:info,res:part', (msg, cb) => {
      expect(msg).to.exist()
      cb()
      done()
    })

    seneca.act('role:info,req:part', payload, (err, reply) => {
      expect(err).to.not.exist()
      expect(reply).to.exist()
    })
  })
})
