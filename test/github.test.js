'use strict'

var Lab = require('lab')
var Code = require('code')
var Seneca = require('seneca')

var lab = exports.lab = Lab.script()

var describe = lab.describe
var it = lab.it
var expect = Code.expect

var Github = require('..')

/*
 * Notice: For travis/CI, tests have been configured with a token provided by
 * https://github.com/thekemkid. However, This is a read only token which will
 * only be able to read from public repos. You can create a similar token in
 * your github settings > personal access tokens > generate new token. You do
 * not have to enable any special permissions for this token.
 */

describe('nodezoo-github', function () {
  it('Fired the get pattern', function (done) {
    var seneca = Seneca({ log: 'silent' })
    seneca.use(Github, { token: process.env.GITHUB_TOKEN })

    seneca.ready(function () {
      seneca.act({ role: 'github', cmd: 'get', name: 'nodejs/node.git', giturl: 'git@github.com:nodejs/node.git' }, function (err, res) {
        expect(err).to.not.exist()
        expect(res.user).to.equal('nodejs')
        expect(res.repo).to.equal('node')
        expect(res.id).to.equal('nodejs/node.git')
        done()
      })
    })
  })

  it('Fired the query pattern', function (done) {
    var seneca = Seneca({ log: 'silent' })
    seneca.use(Github, { token: process.env.GITHUB_TOKEN })

    seneca.ready(function () {
      seneca.act({ role: 'github', cmd: 'query', name: 'nodejs/node.git', user: 'nodejs', repo: 'node' }, function (err, res) {
        expect(err).to.not.exist()
        expect(res.user).to.equal('nodejs')
        expect(res.repo).to.equal('node')
        expect(res.id).to.equal('nodejs/node.git')
        done()
      })
    })
  })

  it('Fired the parse pattern', function (done) {
    var seneca = Seneca({ log: 'silent' })
    seneca.use(Github, { token: process.env.GITHUB_TOKEN })

    seneca.ready(function () {
      seneca.act({ role: 'github', cmd: 'parse', giturl: 'git@github.com:nodejs/node.git' }, function (err, res) {
        expect(err).to.not.exist()
        expect(res.user).to.equal('nodejs')
        expect(res.repo).to.equal('node')
        done()
      })
    })
  })
})
