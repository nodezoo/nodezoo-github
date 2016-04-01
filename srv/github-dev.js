'use strict'

// your github token can be stored in an env variable named token,
// and will be picked up here

var TOKEN = process.env.TOKEN || ''

require('seneca')()
.use('entity')
.use('../github.js', {token: TOKEN})
.add('role:info,req:part', function (args, done) {
  done()

  this.act('role:github,cmd:get', {name: args.name}, function (err, mod) {
    if (err) {
      return done(err);
    }
    this.act('role:info,res:part,part:github', {name: args.name, data: mod.data$()})
  })
})

.add('role:github,info:change', function (args,done) {
  done()
  this.act('role:info,cmd:get', {name:args.name,update:true})
})
.use('mesh', {
  auto: true,
  pin: ['role:github', 'role:info,req:part'],
  model: 'publish'
})
