# Docker module

Library to interact with the host's docker and docker-compose binaries. Has a limited and flavoured list of commands targeted to the specific use case of the DNP_DAPPMANAGER.

## How to use

```js
const docker = require('modules/docker')
const DOCKERCOMPOSE_PATH = 'DNCORE/docker-compose-admin.yml'
const options = { timeout: 0 }
await docker.compose.down(DOCKERCOMPOSE_PATH, options)
```

## API reference

The structure of the command is as follows:

```
docker-compose up -> docker.compose.up
docker volume rm -> docker.volume.rm
```

Currently it doesn't support all methods in the CLI of docker and docker-compose but only those methods used within this application. Detailed documentation of each method can be found in `./Docker.js`

```
docker.compose.up
docker.compose.down
docker.compose.start
docker.compose.stop
docker.compose.rm
docker.compose.rm_up
docker.compose.restart
docker.compose.logs
docker.compose.ps
docker.volume.rm
docker.load
docker.log
docker.status
docker.openPort
docker.closePort
docker.isUpnpAvailable
```

## Implementation

It basically wraps the shelljs library. Another approach is to use the `docker-remote-api` but direct commands offer more flexibility for some necessary custom usecases. Each method is responsible for creating the command string and stringifying the options into flags.
