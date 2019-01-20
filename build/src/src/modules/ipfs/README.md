# Ipfs module

Wrapper of the existing IPFS client library `ipfs-http-client`. Provides additional functionality to handle timeout errors, retries and promisy methods.

## How to use

```js
const ipfs = require("modules/ipfs");
const data = await ipfs.cat(hash, {maxSize: 100000});
```

## API reference

### Cat

```javascript
const HASH = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT'
const fileData = await ipfs.cat(HASH)
```

### Download

```javascript
const HASH = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT'
const PATH = './local/path/file.ext'
function logChunks(chunk) {
    // Called on every chunk received. It's used to show the download progress.
    // See an implementation in packages.js (download function)
}
await ipfs.download(HASH, PATH, logChunks)
```

## Implementation

The IPFS module uses an async.js queue to limit concurrent requests to the IPFS daemon. It has been observed that with too many simulatenous requests the IPFS daemon can malfunction and cancel actions.

`./ipfsQueue.js` wraps the methods defined in `./ipfsTasks.js` to be run through a queue. Also, each task will be run multiple times with an exponential backoff. The exact parameters are defined in `./ipfsParams.js`:

- retry times: 3
- concurrency: 2
- intervalBase: 225 ms
