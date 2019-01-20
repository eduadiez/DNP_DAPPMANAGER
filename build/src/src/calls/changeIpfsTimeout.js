const params = require('../params');

/**
 * Used to test different IPFS timeout parameters live from the ADMIN UI.
 *
 * @return {Object}
 */
const changeIpfsTimeout = async ({timeout}) => {
    params.IPFS_TIMEOUT = timeout;

    return {
        message: `IPFS timeout set to ${timeout}`,
        logMessage: true,
        userAction: true,
    };
};


module.exports = changeIpfsTimeout;

