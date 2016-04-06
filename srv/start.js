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
    token: envs.GITHUB_TOKEN || ''
  },
  mesh: {
    auto: true,
    listen: [
      {pin: 'role:github,cmd:get', model: 'consume'},
      {pin: 'role:info,req:part', model: 'observe'}
    ]
  }
}

Seneca(opts.seneca)
  .use(Entities)
  .use(Github, opts.github)
  .use(Mesh, opts.mesh)
