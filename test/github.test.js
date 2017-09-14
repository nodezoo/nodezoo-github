/* Copyright (c) 2014-2017 Richard Rodger and other contributors, MIT License */

var Code = require('code')
var Lab = require('lab')
var Seneca = require('seneca')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var expect = Code.expect


describe('npm', function () {

  it('query', {timeout: 8888}, function (done) {
    var seen = {}

    Seneca()

    // Place Seneca into test mode. Errors will be passed to done callback,
    // so no need to handle them in callbacks.
      .test(done)

    // Uncomment if you want to see detailed logs
    //.test(done, 'print')

      .use('entity')

    // Load the github plugin
      .use('..')

    // Subscribe to internal messages in order to count calls
      .sub('role:entity', function (msg) {
        seen[msg.cmd] = 1 + (seen[msg.cmd]||0)
      })

      .gate()

      .act('role:github,cmd:query,owner:senecajs,repo:seneca,name:seneca', function (ignore, out) {
        expect(out.owner).equal('senecajs')
        expect(out.repo).equal('seneca')
        expect(out.stars).above(0)
        expect(seen).to.equal({ load: 1, save: 1 })
      })

      .act('role:github,cmd:get,name:seneca', function (ignore, out) {
        expect(out.owner).equal('senecajs')
        expect(out.repo).equal('seneca')
        expect(out.stars).above(0)
        
        expect(seen).to.equal({ load: 2, save: 1 })
      })

      .act('role:github,cmd:get,name:seneca', function (ignore, out) {
        expect(out.owner).equal('senecajs')
        expect(out.repo).equal('seneca')
        expect(out.stars).above(0)
        
        expect(seen).to.equal({ load: 3, save: 1 })
      })

      .ready(done)
  })
})


