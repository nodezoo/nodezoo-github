'use strict'

var GitHub = require('github4')
var github = new GitHub()
var Request = require('request')

var opts = {
  registry: 'http://registry.npmjs.org/',
  token: 'NO_TOKEN'
}

module.exports = function (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  opts = extend(opts, options)
  opts.cache = seneca.make$('github')

  seneca.add('role:github,cmd:get', cmdGet)
  seneca.add('role:info,req:part', aliasGet)

  return {
    name: 'nodezoo-github'
  }
}

function cmdGet (msg, done) {
  var cache = opts.cache
  var registry = opts.registry + msg.name

  cache.load$(msg.name, (err, github) => {
    if (err) return done(err)

    if (github && !msg.update) {
      return done(null, github)
    }

    Request.get({url: registry, gzip: true}, (err, res, body) => {
      if (err) return done(err)

      var data = JSON.parse(body)
      var distTags = data['dist-tags'] || {}
      var latest = ((data.versions || {})[distTags.latest]) || {}
      var repository = latest.repository || {}
      var url = repository.url || ''

      var matches = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(url) || []
      var params = {
        name: msg.name,
        url: url,
        user: matches[1] || '',
        repo: matches[2] || ''
      }

      queryGithub(params, done)
    })
  })
}

function aliasGet (msg, done) {
  var seneca = this
  var payload = {name: msg.name}

  seneca.act('role:github,cmd:get', payload, (err, data) => {
    if (err) return done(err)

    payload.data = data
    seneca.act('role:info,res:part,part:github', payload)
    done()
  })
}

function queryGithub (msg, done) {
  var cache = opts.cache

  github.authenticate({
    type: 'token',
    token: opts.token
  })

  var params = {
    user: msg.user,
    repo: msg.repo
  }

  github.repos.get(params, (err, repo) => {
    if (err) return done(err)
    if (!repo) return done()

    params.state = 'open'

    github.pullRequests.getAll(params, (err, prs) => {
      if (err) return done(err)
      var data = {
        name: msg.repo || '',
        user: msg.user || '',
        repo: msg.repo || '',
        stars: repo.stargazers_count || '',
        watches: repo.subscribers_count || '',
        forks: repo.forks_count || '',
        last: repo.pushed_at || '',
        urlRepo: 'https://github.com/' + msg.user + '/' + msg.repo,
        urlClone: 'git+https://github.com/' + msg.user + '/' + msg.repo + '.git',
        urlSsh: 'git@github.com:' + msg.user + '/' + msg.repo + '.git',
        pullRequests: prs && prs.length || 0,
        cached: Date.now()
      }

      function complete (err) {
        if (err) return done(err)
        else done(null, data)
      }

      cache.load$(msg.name, (err, cached) => {
        if (err) return done(err)
        if (cached) return cached.data$(data).save$(complete)

        data.id$ = msg.name
        cache.make$(data).save$(complete)
      })
    })
  })
}
