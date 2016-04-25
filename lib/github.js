'use strict'

var GitHub  = require('github4')
var Request = require('request')
var async   = require('async'  )

var github  = new GitHub()
var opts    = {
  registry: 'http://registry.npmjs.org/',
  token: 'NO_TOKEN'
}

module.exports = function (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  opts = extend(opts, options)
  opts.cache = seneca.make$('github')
  opts.cache.load$()

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
      return done(null, github.data$(github))
    }

    Request.get({url: registry, gzip: true}, (err, res, body) => {
      if (err) return done(err)

      var data = null

      try { data = JSON.parse(body) }
      catch (e) { return done(e) }

      var distTags = data['dist-tags'] || {}
      var latest = ((data.versions || {})[distTags.latest]) || {}
      var repository = latest.repository || {}
      var url = repository.url || ''

      if(url.length > 0) {
        var matches = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(url)
        var params = {
          name: msg.name,
          url: url,
          user: matches[1] || null,
          repo: matches[2] || null
        }

        if (!params.user || !params.repo) {
          return done(new Error('not found on github'))
        }

        queryGithub(params, done)
      }
      else{
        return done(new Error('not found on github'))
      }
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
    done(null, {ok: true})
  })
}

function queryGithub (msg, done) {
  var cache  = opts.cache

  github.authenticate({
    type : 'token',
    token: opts.token
  })

  async.parallel({
    getRepository  : function (callbackFn) {
      github.repos.get({
        user: msg.user,
        repo: msg.repo
      }, callbackFn)
    },

    getReadme      : function (callbackFn) {
      github.repos.getReadme({
        user: msg.user,
        repo: msg.repo
      }, (err, readme_b64) => {
        if (err) {
          callbackFn(err, null)
        } else {
          if (readme_b64) {
            github.misc.renderMarkdownRaw({
              data: new Buffer(readme_b64.content, 'base64').toString("ascii")
            }, (err, readme) => {
              if (err && !readme) { // GitHub NodeJS API fails expecting a JSON response
                callbackFn(err, null)
              } else {
                callbackFn(null, readme.data)
              }
            })
          } else {
            callbackFn(null, false)
          }
        }
      })
    },

    getPullRequests: function (callbackFn) {
      github.pullRequests.getAll({
        user : msg.user,
        repo : msg.repo,
        state: 'open'
      }, callbackFn)
    }
  }, function (err, results) {
    if (err)
      return done(err)

    var data = {
      name        : msg.repo || '',
      user        : msg.user || '',
      repo        : msg.repo || '',
      stars       : results.getRepository.stargazers_count || 0,
      watches     : results.getRepository.subscribers_count || 0,
      forks       : results.getRepository.forks_count || 0,
      last        : results.getRepository.pushed_at || '',
      urlRepo     : 'https://github.com/' + msg.user + '/' + msg.repo,
      urlClone    : 'git+https://github.com/' + msg.user + '/' + msg.repo + '.git',
      urlSsh      : 'git@github.com:' + msg.user + '/' + msg.repo + '.git',
      readme      : results.getReadme,
      pullRequests: results.getPullRequests && results.getPullRequests.length || 0,
      cached      : Date.now()
    }

    function complete (err, data) {
      if (err)
        return done(err)

      return done(null, data.data$(data))
    }

    cache.load$(msg.name, (err, cached) => {
      if (err)
        return done(err)

      if (cached)
        return cached.data$(data).save$(complete)

      data.id$ = msg.name
      cache.make$(data).save$(complete)
    })
  })
}
