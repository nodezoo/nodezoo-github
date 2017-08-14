/* Copyright (c) 2014-2017 Richard Rodger and other contributors, MIT License */

var MOCK_NPM = JSON.parse(process.env.MOCK_NPM || 'false')
var MOCK_INFO = JSON.parse(process.env.MOCK_INFO || 'false')
var MOCK = MOCK_NPM || MOCK_INFO

var TOKEN = process.env.TOKEN || 'NO_TOKEN'


var Seneca = require('seneca')


Seneca({tag: 'github'})
  .test('print')

  .use('entity')
  .use('jsonfile-store', {folder: __dirname+'/../data'})

  .use('..',{token:TOKEN})

  .add('role:info,need:part',function(args,done){
    done()

    this.act(
      'role:github,cmd:get',
      {name:args.name},

      function(err,mod){
        if( err ) return;

        if( mod ) {
          return this.act(
            'role:info,collect:part,part:github',
            {name:args.name,data:this.util.clean(mod.data$())})
        }

        this.act( 
          'role:npm,cmd:get', {name:args.name},
          function(err,mod){
            if( err ) return;

            if( mod ) {
              this.act(
                'role:github,cmd:get',
                {name:args.name,giturl:mod.giturl},
                function( err, mod ){
                  if( err ) return;

                  if( mod ) {
                    this.act('role:info,collect:part,part:github',
                             {name:args.name,data:this.util.clean(mod.data$())})
                  }
                })
            }
          })
      })
  })


  .use('seneca-repl', {port:10050})

  .listen(9050)

  .client({pin:'role:info', port:9030})
  .client({pin:'role:npm', port:9040})


// Run mock services that this service depends on.
if (MOCK) {
  var mock = Seneca({tag:'mock'})
        .test('print')
        .use('entity')

  if (MOCK_NPM) {
    mock
    .listen(9040)
    .add('role:npm', function (msg, reply) {
      reply({"entity$":{"name":"npm"},"name":"jsonic","version":"0.2.2","giturl":"git://github.com/rjrodger/jsonic.git","desc":"JSON parser that isn't strict","readme":"","id":"jsonic"})
    })
  }

  if (MOCK_INFO) {
    mock
    .listen(9030)
    .add('role:info', function (msg, reply) {
      reply()
    })
  }
}
