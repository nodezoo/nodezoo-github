'use strict';

require('seneca')()
  .use('redis-transport')
  .use('jsonfile-store',{folder:__dirname+'/../data'})
  .use('beanstalk-transport')
  .use('../github.js')
  .add('role:info,req:part',function(args,done){
    done();
    this.act('role:github,cmd:get', {name:args.name}, function(err,mod){
      if (err) { return; }

      if  (mod) {
        this.act('role:info,res:part,part:github', {name:args.name,data:mod.data$()});
      }
      else {
        this.act('role:npm,cmd:get', {name:args.name}, function(err,mod){
          if( err ) { return; }

          if( mod ) {
            this.act('role:github,cmd:get', {name:args.name,giturl:mod.giturl}, function( err, mod ){
              if (err) { return; }
              if (mod) {
                this.act('role:info,res:part,part:github', {name:args.name,data:mod.data$()});
              }
            });
          }
        });
      }
    });
  })
  .listen({host: process.env.REDIS_IP, type:'redis',pin:'role:info,req:part'})
  .client({host: process.env.REDIS_IP, type:'redis',pin:'role:info,res:part'})
  .client({host: process.env.BEANSTALK_IP, port: 1130, type: 'beanstalk', pin: 'role:npm,cmd:*'})
  .listen({host: process.env.BEANSTALK_IP, port: 1130, type: 'beanstalk', pin: 'role:github,cmd:*'});

