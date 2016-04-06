'use strict'

var GitHub = require('github4')
var github = new GitHub()
var Request = require('request')
var _ = require('lodash')
var gitUrl

var opts = {
  registry: 'http://registry.npmjs.org/',
  token: ''
}

module.exports = function (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  opts = extend(opts, options)

  seneca.add('role:github,cmd:get', cmdGet)
  seneca.add('role:github,cmd:query', cmdQuery)
  seneca.add('role:github,cmd:parse', cmdParse)
  seneca.add('role:github,cmd:extract', cmdExtract)

  seneca.add('role:info,req:part', function (args, done) {
    console.log('foo')
    done()

    this.act('role:github,cmd:get', {name: args.name}, function (err, mod) {
      if (err) {
        return done(err)
      }
      this.act('role:info,res:part,part:github', {name: args.name, data: mod.data$()})
    })
  })

  return {
    name: 'nodezoo-github'
  }
}

function cmdGet (args, done) {
  var seneca = this

  var githubName = args.name
  var githubEnt = seneca.make$('github')

  var url = opts.registry + githubName
  // check if in the cache
  githubEnt.load$(githubName, function (err, github) {
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

  var githubEnt = seneca.make$('github')
  var githubName = args.name
  var user = args.user
  var repo = args.repo

  github.authenticate({
    type: 'basic',
    username: opts.token,
    password: 'x-oauth-basic'
  })

  github.repos.get({user: user, repo: repo}, function (err, repo) {
    if (err) {
      return done(err)
    }
    var data
    if (repo) {
      var pullRequests = []
      github.pullRequests.getAll({user: user, repo: githubName, state: 'open'}, function (err, response) {
        if (err) {
          console.log(err)
        }
        if (response) {
          pullRequests = response
        }
      })
      data = {
        name: args.repo || '',
        user: args.user || '',
        repo: args.repo || '',
        stars: repo.stargazers_count || '',
        watches: repo.subscribers_count || '',
        forks: repo.forks_count || '',
        last: repo.pushed_at || '',
        url: gitUrl || '',
        gitClone: repo.clone_url || '',
        pullRequests: pullRequests.length || ''
      }
      // update the data if module exists in cache, if not create it
      githubEnt.load$(githubName, function (err, github) {
        if (err) {
          return done(err)
        }
        if (github) {
          return github.data$(data).save$(done)
        }
        else {
          data.id$ = githubName
          githubEnt.make$(data).save$(done)
        }
      })
    }
    else return done()
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
