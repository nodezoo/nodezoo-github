/* Copyright (c) 2014-2017 Richard Rodger and other contributors, MIT License */

var PORT = process.env.PORT || 9000
var Seneca = require('seneca')

Seneca({tag: 'github', legacy: {meta: true}})
  .listen(PORT)

  .use('redis-transport')
  .use('entity')
  .use('jsonfile-store', {folder: __dirname+'/../data'})

  .use('../github.js')

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

  .listen({pin:'role:info,need:part', type:'redis', host:'redis', port:6379})
  .client({pin:'role:info,collect:part', type:'redis', host:'redis', port:6379})

  .client({pin:'role:npm', host:'npm', port:PORT})


