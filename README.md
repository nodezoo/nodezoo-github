![Nodezoo](https://raw.githubusercontent.com/rjrodger/nodezoo-web/to-redux/client/assets/img/logo-nodezoo.png)

## nodezoo-github
Nodezoo.com micro-service handling github meta data. Please see the [main repo][] for more details

- __Sponsor:__ [nearForm][]
- __Lead:__ [Richard Rodger][Lead]

## Install
1. clone this repo into a root _/nodezoo_ folder.
2. run `npm install`

## Starting
To start simply run,

```
$ node srv/github-dev.js --seneca.options.github.token=GITHUB-PERSONAL-ACCESS-TOKEN --seneca.log.all
```
### Tagging and Logs
To tag your service and set up logs simply pass the relevant switches on start,

```
node srv/github-dev.js -- --seneca.options.tag=nodezoo-github --seneca.log.all
```
## Creating a GitHub Personal Access Token

  - In the top right corner of any page, click your profile photo, then click Settings.
  - In the user settings sidebar, click Personal access tokens.
  - Click Generate new token
  - Give your token a descriptive name.
  - Select the scopes you wish to grant to this token. The default scopes allow you to interact with public and private repositories, user data, and gists
  - Click Generate token.
  - Copy the token to your clipboard. For security reasons, after you navigate off this page, no one will be able to see the token again.

## Inbound Messages

This micro-service recognizes the following messages:

  * _role:github,cmd:get_
  * _role:github,cmd:query_
  * _role:github,cmd:parse_

## Outbound Messages

This micro-service emits no outbound messages.

## Running with Curl

Any of the messages above can be run using curl in the following format in the command line
```
curl -d '{"role":"github","cmd":"get"}' http://localhost:52472/act
```
_Note_: Ports are assigned automatically, please check the logs for the correct port to use.
## Contributing
The [NodeZoo][] org encourages __open__ and __safe__ participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

- Before contributing please review our __[Code of Conduct][CoC]__

## License
Copyright (c) 2015, Richard Rodger and other contributors.
Licensed under [MIT][].

[main repo]: https://github.com/rjrodger/nodezoo
[MIT]: ./LICENSE
[Code of Conduct]: https://github.com/nearform/vidi-contrib/docs/code_of_conduct.md
[nearForm]: http://www.nearform.com/
[NodeZoo]: http://www.nodezoo.com/
[CoC]: ./CoC.md
[Lead]: https://github.com/rjrodger
