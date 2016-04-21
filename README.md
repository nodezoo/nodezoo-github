![Nodezoo][Logo]

# nodezoo-github

- __Lead:__ [Dean McDonnell][Lead]
- __Sponsor:__ [nearForm][Sponsor]

A micro-service that provides Github related information to [NodeZoo][]. This
micro-service requires a valid Github token to function, please see the Config
section below for details on how to obtain.

If you're using this micro-service, and need help, you can:

- Post a [github issue][],
- Tweet to [@nodezoo][],
- Ask on the [Gitter][gitter-url].

## Running
This micro-service can be ran as part of a complete system or as a single isolated
unit.

### As a complete system
A special system repository is available that runs the complete system using Docker
and Fuge.

- [Nodezoo: The complete system][System]

### Isolated mode
To make testing easier this micro-service can be ran in 'isolated' mode. This mode
allows testing over http using a well defined port. Please note isolated mode means
patterns are not exposed via mesh.

To run in isolated mode,

 - Clone this repository locally,
 - Run `npm install`,
 - Run `GITHUB_TOKEN=YOUR_TOKEN npm start isolated`,

__Note:__ You will need to have a valid github token to use isolated mode.

A simple http service is supported and can be called using Curl or other Rest client.
The default port is `8052`. It can be changed using the `GITHUB_PORT` environment
variable.

```
curl -d '{"role":"github","cmd":"get","name":"hapi"}' http://localhost:8052/act
```

## Configuration

### Creating a GitHub Personal Access Token
You will need a token for this service if regardless of how you choose to run it.

  - On github.com, click your profile photo, then click settings.
  - In the user settings sidebar, click Personal access tokens.
  - Click Generate new token
  - Give your token a descriptive name.
  - Select the scopes you wish to grant, select all read-only scopes
  - Click 'Generate token'.
  - Copy the token to your clipboard and keep safe.

### Environment Variables
Various settings can be changed using environment variables, see the list below for
all available variable names.

#### GITHUB_TOKEN
  - The token to use when calling the GitHub api.
  - Defaults to `NO_TOKEN`,

#### GITHUB_HOST
  - The host to listen on in isolated mode.
  - Defaults to `localhost`

#### GITHUB_PORT
  - The port to listen on in isolated mode.
  - Defaults to `8052` .

#### GITHUB_ISOLATED
  - Starts isolated mode.
  - Defaults to `false`.

#### GITHUB_REGISTRY
  - Change the registry used to validate the module name.
  - Defaults to `http://registry.npmjs.org/`.

  ## Sample Data
  ```json
  {
  "entity$": "-\/-\/github_cache",
  "name": "fuge",
  "user": "apparatus",
  "repo": "fuge",
  "stars": 155,
  "watches": 15,
  "forks": 18,
  "last": "2016-04-09T21:57:45Z",
  "urlRepo": "https:\/\/github.com\/apparatus\/fuge",
  "urlClone": "git+https:\/\/github.com\/apparatus\/fuge.git",
  "urlSsh": "git@github.com:apparatus\/fuge.git",
  "pullRequests": 1,
  "cached": 1461229347738
}
  ```
  
## Messages Handled
This micro-service handles the following messages.

### `role:github,cmd:get`
Request a module's Github details. The name supplied must be a valid module on npm.

```js
seneca.act('role:github,cmd:get', {name: 'seneca'}, (err, data) => {})
```

### `role:info,req:part`
Acts as an alias for `role:github,cmd:get` but instead of returning data directly a
message is emitted using the pattern `role:info,res:part`. Allows integration with
the wider nodezoo system.

```js
seneca.act('role:info, req:part', {name: 'seneca'}, (err, data) => {})
```

## Messages Emitted
This micro-service emits the following messages

### `role:info,res:part`
Contains the response of an earlier call to `role:info,req:part`.

```js
seneca.add('role:info,res:part', (msg, done) => {})
```

## Data Emitted
- name - Name of the module
- user - The User or Organisation that owns the repository
- repo - The repository name
- stars - Number of stars
- forks - Number of forks
- watches - Numbers of watchers
- last - The last commit to the repository
- urlRepo - A link to the repository
- urlClone - A clone URL
- urlSsh - An SSH URL
- pullRequests - Open pull requests
- cached - The time the data was last cached at

## Contributing
The [NodeZoo org][] encourages __open__ and __safe__ participation.

- __[Code of Conduct]__

If you feel you can help in any way, be it with documentation, examples, extra testing, or new
features please get in touch.

## License
Copyright (c) 2014-2016, Richard Rodger and other contributors.
Licensed under [MIT][].

[main repo]: https://github.com/rjrodger/nodezoo
[MIT]: ./LICENSE
[Code of Conduct]: https://github.com/nodezoo/nodezoo-org/blob/master/CoC.md
[Sponsor]: http://www.nearform.com/
[NodeZoo org]: http://www.nodezoo.com/
[NodeZoo]: https://github.com/nodezoo
[Lead]: https://github.com/mcdonnelldean
[github issue]: https://github.com/nodezoo/nodezoo-github/issues
[@nodezoo]: http://twitter.com/nodezoo
[gitter-url]: https://gitter.im/nodezoo/nodezoo-org
[System]: https://github.com/nodezoo/nodezoo-system
[Logo]: https://raw.githubusercontent.com/nodezoo/nodezoo-org/master/assets/logo-nodezoo.png
