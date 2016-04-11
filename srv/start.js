'use strict'

var Seneca = require('seneca')
var Entities = require('seneca-entity')
var Mesh = require('seneca-mesh')
var Github = require('../lib/github')
var RedisStore = require('seneca-redis-store')

var envs = process.env
var opts = {
  seneca: {
    tag: envs.GITHUB_TAG || 'nodezoo-github'
  },
  github: {
    token: envs.GITHUB_TOKEN || 'NO_TOKEN',
    registry: envs.GITHUB_REGISTRY || 'http://registry.npmjs.org/'
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
  },
  redis: {
    host: envs.GITHUB_REDIS_HOST || 'localhost',
    port: envs.GITHUB_REDIS_PORT || '6379'
  }
}

var Service = Seneca(opts.seneca)

Service.use(Entities)

if (envs.GITHUB_ISOLATED) {
  Service.listen(opts.isolated)
}
else {
  Service.use(Mesh, opts.mesh)
  Service.use(RedisStore, opts.redis)
}

Service.use(Github, opts.github)
