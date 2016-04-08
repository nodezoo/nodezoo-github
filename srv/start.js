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
    host: 'localhost',
    port: envs.redis_PORT || '6379'
  }
}

console.log(envs.GITHUB_TOKEN)

var Service =
Seneca(opts.seneca)
  .use(Entities)
  .use(RedisStore, opts.redis)
  .use(Github, opts.github)

envs.GITHUB_ISOLATED
  ? Service.listen(opts.isolated)
  : Service.use(Mesh, opts.mesh)
