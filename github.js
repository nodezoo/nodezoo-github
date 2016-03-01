'use strict'

var GitHub = require('github')
var github = new GitHub({version: '3.0.0'})

var opts = {
  token: ''
}

module.exports = function (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  opts = (opts, options)

  seneca.add('role:github,cmd:get', cmd_get)
  seneca.add('role:github,cmd:query', cmd_query)
  seneca.add('role:github,cmd:parse', cmd_parse)

  return {
    name: 'nodezoo-github'
  }
}

function cmd_get (msg, done) {
  var seneca = this
  var store = seneca.make$('github')

  store.load$(msg.name, function (err, model) {
    if (err) return done(err)

    if (model) {
      return done(null, model)
    }

    if (msg.giturl) {
      seneca.act('role:github,cmd:parse', {name: msg.name, giturl: msg.giturl}, function (err, out) {
        if (err) return done(err)
        else seneca.act('role:github,cmd:query', {name: msg.name, user: out.user, repo: out.repo}, done)
      })
    }

    return done()
  })
}


function cmd_query (msg, done) {
  var seneca = this
  var store = seneca.make$('github')

  var github_name = msg.name
  var user = msg.user
  var repo = msg.repo

  github.authenticate({
    type: 'basic',
    username: opts.token,
    password: 'x-oauth-basic'
  })

  github.repos.get({user: user, repo: repo}, function (err,repo) {
      if (err) return done(err)

      var data
      if (repo) {
        data = {
          user: msg.user,
          repo: msg.repo,
          stars: repo.stargazers_count,
          watches: repo.subscribers_count,
          forks: repo.forks_count,
          last: repo.pushed_at
        }

        store.load$(github_name, function (err, model) {
          if (err) return done(err)

          if (model) {
            return model.data$(data).save$(done)
          }
          else {
            data.id$ = github_name
            store.make$(data).save$(done)
          }
        })
      }

      else return done()
    }
  )
}

function cmd_parse (msg, done) {
  var seneca  = this

  var matches = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(msg.giturl)

  if (matches) done(null, {user: matches[1], repo: matches[2]})
  else done()
}
