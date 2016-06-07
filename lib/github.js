'use strict'

var GitHub = require('github4')
var github = new GitHub()
var Request = require('request')
var Async = require('async')

var opts = {
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
  let moduleName = msg.name

  let cache = opts.cache
  let registry = opts.registry + moduleName
  let context = this

  context.log.debug(`Processing module:  ${moduleName}`)
  cache.load$(moduleName, (err, github) => {
    if (err) {
      context.log.debug(`Cannot load from cache module ${moduleName}, try now to get it remotely`)
    }

    if (github && !msg.update) {
      context.log.debug('Returned cached information: ', moduleName)
      return done(null, {ok: true, data: github.data$(github)})
    }

    Request.get({url: registry, gzip: true}, (err, res, body) => {
      if (err) {
        return done(err)
      }

      var data = null

      try {
        data = JSON.parse(body)
      }
      catch (e) {
        return done(e)
      }

      var distTags = data['dist-tags'] || {}
      var latest = ((data.versions || {})[distTags.latest]) || {}
      var repository = latest.repository || {}
      var url = repository.url || ''

      context.log.debug(`Module: ${moduleName}, github url: ${url}`)
      if (url.length > 0) {
        var matches = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(url)

        if (matches && matches.length >= 2) {
          var params = {
            name: moduleName,
            url: url,
            user: matches[1] || null,
            repo: matches[2] || null
          }

          if (!params.user || !params.repo) {
            return done(null, {ok: false, err: new Error(`module ${moduleName} not found on github`)})
          }

          queryGithub(params, done)
        }
        else {
          return done(null, {ok: false, err: new Error(`invalid github url: ${url}, for module: ${moduleName}`)})
        }
      }
      else {
        return done(null, {ok: false, err: new Error(`module ${moduleName} not found on github`)})
      }
    })
  })

  function queryGithub (params, done) {
    var cache = opts.cache

    github.authenticate({
      type: 'token',
      token: opts.token
    })

    Async.parallel({
      getRepository: function (cb) {
        github.repos.get({user: params.user, repo: params.repo}, function (err, data) {
          if (data && data.meta){
            context.log.debug('Github rate limit information: ', {
              'x-ratelimit-remaining': data.meta['x-ratelimit-remaining'],
              'x-ratelimit-limit': data.meta['x-ratelimit-limit']
            })
          }

          if (err) {
            context.log.debug(`Read repo for ${moduleName} get error: ${err}`)
          }

          cb(err, data)
        })
      },

      getReadme: function (cb) {
        github.repos.getReadme({user: params.user, repo: params.repo}, (err, readme) => {
          if (err) {
            context.log.debug(`Read readme for ${moduleName} get error: ${err}`)
            // don't report error, as we want to search for other information, even if Readme is not loaded
            return cb(null, false)
          }

          if (!readme || !readme.content) {
            context.log.debug(`Read readme for ${moduleName} no content`)
            return cb(null, false)
          }

          github.misc.renderMarkdownRaw({
            data: new Buffer(readme.content, 'base64').toString('ascii')
          }, (err, response) => {
            if (err && !response) {
              context.log.debug(`Render readme for ${moduleName} error: ${err}`)
              // don't report error, as we want to search for other information, even if Readme is not loaded
              return cb(null, false)
            } // API fails expecting a JSON object

            cb(null, response.data)
          })
        })
      },

      getPullRequests: function (cb) {
        github.pullRequests.getAll({user: params.user, repo: params.repo, state: 'open'}, function (err, data) {
          if (err) {
            context.log.debug(`Read Github pull requests for ${moduleName} get error: ${err}`)
          }

          // don't report error, as we might have useful data
          return cb()
        })
      }
    }, (err, results) => {
      if (err) {
        context.log.debug(`Read pull requests for ${moduleName} got error: ${err}`)
        return done(null, {ok: false, err: err})
      }
      var data = {
        name: params.repo || '',
        user: params.user || '',
        repo: params.repo || '',
        stars: results.getRepository ? results.getRepository.stargazers_count || 0 : 0,
        watches: results.getRepository ? results.getRepository.subscribers_count || 0 : 0,
        forks: results.getRepository ? results.getRepository.forks_count || 0 : 0,
        last: results.getRepository ? results.getRepository.pushed_at || '' : '',
        urlRepo: 'https://github.com/' + params.user + '/' + params.repo,
        urlClone: 'git+https://github.com/' + params.user + '/' + params.repo + '.git',
        urlSsh: 'git@github.com:' + params.user + '/' + params.repo + '.git',
        readme: results.getReadme,
        pullRequests: results.getPullRequests && results.getPullRequests.length || 0,
        cached: Date.now()
      }

      context.log.debug(`Read Github data for module ${moduleName} completed.`)
      cache.load$(params.name, (err, cached) => {
        if (err) {
          return complete(err)
        }

        if (cached) {
          return cached.data$(data).save$(complete)
        }

        data.id$ = params.name
        cache.make$(data).save$(complete)
      })

      function complete (err, data) {
        if (err) {
          context.log.debug(`Save Github data for ${moduleName} got error: ${err}`)
          return done(err)
        }
        else done(null, {ok: true, data: data ? data.data$(data) : data})
      }
    })
  }
}

function aliasGet (msg, done) {
  var seneca = this
  var payload = {name: msg.name}

  seneca.act(`role:github, cmd:get, update: ${msg.update || false}`, payload, (err, res) => {
    if (err) {
      return done(null, {ok: false, err: err})
    }

    if (res && res.ok) {
      payload.data = res.data
      seneca.act('role:info,res:part,part:github', payload)
    }

    done(null, {ok: true})
  })
}
