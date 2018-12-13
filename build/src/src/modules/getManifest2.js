const isIpfsHash = require('utils/isIpfsHash');
const isEnsDomain = require('utils/isEnsDomain');
const ipfs = require('modules/ipfs');
const apm = require('modules/apm');

// Used by
// calls / fetchDirectory;
// calls / fetchPackageData;
// calls / fetchPackageVersions;
// calls / installPackage;
// dappGet / getPkgDeps;

/**
 * Resolves the package request to the APM and fetches the manifest from IPFS.
 * It recognizes different types of requests:
 * - {name: kovan.dnp.dappnode.eth, ver: 0.1.0}
 * - {name: kovan.dnp.dappnode.eth, ver: 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ'}
 * - {name: 'ipfs/QmUHFxFbYdJDueBWzYZnvpzkjwBmMt3bmNDLQBTZzY18UZ', ver: ''}
 *
 * @param {object} packageReq package request
 * @param {object} options package request
 * @return {object} parsed manifest
 */
async function getManifest({name, ver, version}) {
    // Make the arguments compatible with old stardard
    if (!ver && version) ver = version;
    // Assert kwargs
    if (!name) throw Error(`getManifest kwargs must contain property "name"`);
    if (!ver) throw Error(`getManifest kwargs must contain property "ver"`);

    // 1. Get manifest hash
    let hash; let origin;
    if (isIpfsHash(ver)) {
        origin = hash = ver;
    } else if (isEnsDomain(name)) {
        hash = await apm.getRepoHash({name, ver});
    } else {
        throw Error(`Unkown package request name: ${name}, ver: ${ver}`);
    }

    // 2. Download manifest and parse it
    // pass a maxSize = 100KB option which will throw an error if that size is exceeded
    const manifestUnparsed = await ipfs.cat(hash, {maxSize: 100000});
    let manifest;
    try {
        manifest = JSON.parse(manifestUnparsed);
    } catch (e) {
        throw Error(`Error JSON parsing the manifest: ${e.message}`);
    }

    // Verify the manifest
    if (!manifest.image || typeof manifest.image !== 'object') {
        throw Error(`Invalid manifest: it does not contain the expected property 'image'`);
    }
    if (!manifest.image.hash) {
        throw Error(`Invalid manifest: it does not contain the expected property 'image.hash'`);
    }
    if (isEnsDomain(name) && (manifest || {}).name !== name) {
        throw Error('Package name requested doesn\'t match its manifest');
    }

    return {
        ...manifest,
        origin,
    };
}


module.exports = getManifest;
