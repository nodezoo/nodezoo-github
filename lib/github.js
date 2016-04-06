'use strict'

var GitHub = require('github4')
var github = new GitHub()
var Request = require('request')
var _ = require('lodash')
var gitUrl

var opts = {
  registry: 'http://registry.npmjs.org/',
  token: 'NO_TOKEN'
}

module.exports = function (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  opts = extend(opts, options)

  seneca.add('role:github,cmd:get', cmdGet)
  seneca.add('role:github,cmd:query', cmdQuery)
  seneca.add('role:github,cmd:parse', cmdParse)
  seneca.add('role:github,cmd:extract', cmdExtract)
  seneca.add('role:info,req:part', aliasGet)

  return {
    name: 'nodezoo-github'
  }
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

function cmdGet (args, done) {
  var seneca = this
  var cache = seneca.make$('github')

  var githubName = args.name
  var url = opts.registry + githubName

  cache.load$(githubName, function (err, github) {
    if (err) {
      return done(err)
    }
    if (github && !args.update) {
      return done(null, github)
    }
    else {
      // get giturl from npm
      Request.get({url: url, gzip: true}, function (err, res, body) {
        if (err) {
          return done(err)
        }
        else if (_.isEmpty(JSON.parse(body))) {
          return done(err)
        }
        var data = JSON.parse(body)
        // take giturl from npm data
        seneca.act('role:github,cmd:extract', {data: data}, function (err, data) {
          if (err) {
            return done(err)
          }
          // parse username and repo from giturl
          var gitData = cmdParse(data)

          if (gitData) {
            var user = gitData[1]
            var repo = gitData[2]
            gitUrl = 'http://github.com/' + user + '/' + repo
          }
          if (!user) {
            return done(err)
          }
          else {
            // get github data using github username and repo name
            seneca.act('role:github,cmd:query', {name: githubName, user: user, repo: repo}, done)
          }
        })
      })
    }
  })
}

function cmdQuery (args, done) {
  var seneca = this

  var cache = seneca.make$('github')
  var githubName = args.name
  var user = args.user
  var repo = args.repo

  github.authenticate({
    type: 'token',
    token: opts.token
  })

  var getRepos = {
    user: user,
    repo: repo
  }

  github.repos.get(getRepos, (err, repo) => {
    if (err) return done(err)
    if (!repo) return done()

    var data
    var pullRequests = []
    var getPullRequests = {
      user: user,
      repo: githubName,
      state: 'open'
    }

    github.pullRequests.getAll(getPullRequests, (err, prs) => {
      if (err) console.log(err)

      var data = {
        name: args.repo || '',
        user: args.user || '',
        repo: args.repo || '',
        stars: repo.stargazers_count || '',
        watches: repo.subscribers_count || '',
        forks: repo.forks_count || '',
        last: repo.pushed_at || '',
        urlRepo: gitUrl || '',
        urlClone: repo.clone_url || '',
        pullRequests: prs && prs.length || 0,
        cached: Date.now()
      }

      function complete (err) {
        if (err) return done (err)
        else done (null, data)
      }

      cache.load$(githubName, function (err, github) {
        if (err) return done(err)
        if (github) return github.data$(data).save$(complete)

        data.id$ = githubName
        cache.make$(data).save$(complete)
      })
    })
  })
}

function cmdExtract (args, done) {
  var data = args.data
  var distTags = data['dist-tags'] || {}
  var latest = ((data.versions || {})[distTags.latest]) || {}
  var repository = latest.repository || {}

  var out = {
    giturl: repository.url
  }

  done(null, out)
}

function cmdParse (args) {
  var m = /[\/:]([^\/:]+?)[\/:]([^\/]+?)(\.git)*$/.exec(args.giturl)
  if (m) {
    return (m)
  }
  else {
    return null
  }
}
