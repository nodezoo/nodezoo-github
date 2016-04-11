'use strict'

var Lab = require('lab')
var Code = require('code')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var Seneca = require('seneca')
var Github = require('..')

function createInstance () {
  var params = {
    log: 'silent',
    errhandler: (err) => {
      if (err.at) console.log(err.msg)
    }
  }

  return Seneca(params)
    .use('entity')
    .use(Github, {token: process.env.GITHUB_TOKEN})
}

describe('A valid "role:github,cmd:get" call', () => {
  it('has no error', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
      expect(err).to.not.exist()
      done()
    })
  })

  it('has data', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
      expect(reply).to.exist()
      done()
    })
  })

  it('returns cached data', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
      var cachedOne = reply.cached

      seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
        var cachedTwo = reply.cached

        expect(cachedOne).to.equal(cachedTwo)
        done()
      })
    })
  })

  it('can return non-cached data', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
      expect(err).to.not.exist()

      var cachedOne = reply.cached
      payload.update = true

      seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
        var cachedTwo = reply.cached

        expect(cachedOne).to.be.below(cachedTwo)
        done()
      })
    })
  })
})

describe('An invalid "role:github,cmd:get" call', () => {
  it('has an error', (done) => {
    var seneca = createInstance()
    var payload = {name: 'shooobydoobydooboop', fatal$: false}

    seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
      expect(err).to.exist()
      done()
    })
  })

  it('has no data', (done) => {
    var seneca = createInstance()
    var payload = {name: 'shooobydoobydooboop'}

    seneca.act(`role:github,cmd:get`, payload, (err, reply) => {
      expect(reply).to.not.exist()
      done()
    })
  })
})

describe('A valid "role:info,req:part" call', () => {
  it('has no error', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.act(`role:info,req:part`, payload, (err, reply) => {
      expect(err).to.not.exist()
      done()
    })
  })

  it('has data', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.act(`role:info,req:part`, payload, (err, reply) => {
      expect(reply).to.exist()
      done()
    })
  })


  it('responds via "role:info,res:part"', (done) => {
    var seneca = createInstance()
    var payload = {name: 'seneca'}

    seneca.add(`role:info,res:part`, (msg, cb) => {
      expect(msg).to.exist()
      cb()
      done()
    })

    seneca.act(`role:info,req:part`, payload)
  })
})
