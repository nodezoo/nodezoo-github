'use strict'

var Seneca = require('seneca')
var Entities = require('seneca-entity')
var Mesh = require('seneca-mesh')
var Github = require('../lib/github')

var envs = process.env
var opts = {
  seneca: {
    tag: envs.GITHUB_TAG || 'nodezoo-github'
  },
  github: {
    token: envs.GITHUB_TOKEN || '668fd718441b4d97699763b9d97f402c8370d331'
  },
  mesh: {
    auto: true,
    listen: [
      {pin: 'role:github,cmd:get', model: 'consume'},
      {pin: 'role:info,req:part', model: 'observe'}
    ]
  },
  isolated: {
    host: envs.GITHUB_HOST || 'localhost',
    port: envs.GITHUB_PORT || '8052'
  }
}

var Service =
Seneca(opts.seneca)
  .use(Entities)
  .use(Github, opts.github)

envs.GITHUB_ISOLATED
  ? Service.listen(opts.isolated)
  : Service.use(Mesh, opts.mesh)
