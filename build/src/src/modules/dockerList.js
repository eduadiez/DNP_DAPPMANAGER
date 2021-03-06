// node modules
const logs = require('logs.js')(module);
const {promisify} = require('util');
const docker = require('docker-remote-api');
const request = docker();

// dedicated modules
const params = require('../params');

const DNP_CONTAINER_NAME_PREFIX = params.DNP_CONTAINER_NAME_PREFIX;
const CORE_CONTAINER_NAME_PREFIX = params.CORE_CONTAINER_NAME_PREFIX;

// ////////////////////////////
// Main functions
//  (Docker API)
//  endpoint documentation https://docs.docker.com/engine/api/v1.24/#31-containers

async function listContainers() {
  const containers = await dockerRequest('get', '/containers/json?all=true');
  return containers
    .map(format)
    .filter((pkg) => pkg.isDNP || pkg.isCORE);
}

async function runningPackagesInfo() {
  const containers = await listContainers();
  const containersObject = {};
  containers.forEach(function(container) {
    containersObject[container.name] = container;
  });
  return containersObject;
}


// /////////////////
// Helper functions


function dockerRequest(method, url) {
  const options = {json: true};
  if (method == 'post') options.body = null;

  const dockerRequestPromise = promisify(request[method].bind(request));
  return dockerRequestPromise(url, options);
}


// /////////
// utils


function format(c) {
  const packageName = c.Names[0].replace('/', '');
  const isDNP = packageName.includes(DNP_CONTAINER_NAME_PREFIX);
  const isCORE = packageName.includes(CORE_CONTAINER_NAME_PREFIX);

  let name;
  if (isDNP) name = packageName.split(DNP_CONTAINER_NAME_PREFIX)[1];
  else if (isCORE) name = packageName.split(CORE_CONTAINER_NAME_PREFIX)[1];
  else name = packageName;

  const shortName = name && name.includes('.') ? name.split('.')[0] : name;

  let version = c.Image.split(':')[1] || '0.0.0';
  // IPFS path
  if (version && version.startsWith('ipfs-')) {
    version = version.replace('ipfs-', '/ipfs/');
  }

  // Process dappnode.dnp tags
  //   dappnode.dnp.dependencies
  //   dappnode.dnp.origin
  let origin;
  let dependencies;
  if (c.Labels && typeof c.Labels === 'object') {
    origin = c.Labels['dappnode.dnp.origin'];
    if (c.Labels['dappnode.dnp.dependencies']) {
      try {
        dependencies = JSON.parse(c.Labels['dappnode.dnp.dependencies']);
      } catch (e) {
        /* eslint-disable max-len */
        logs.warn(`Error parsing ${name} container dependencies label "${c.Labels['dappnode.dnp.dependencies']}": ${e.stack}`);
        /* eslint-enable max-len */
      }
    }
  }

  const portsToClose = c.Labels.portsToClose ? JSON.parse(c.Labels.portsToClose) : [];

  return {
    id: c.Id,
    packageName,
    version,
    origin,
    dependencies,
    portsToClose,
    isDNP,
    isCORE,
    created: new Date(1000*c.Created),
    image: c.Image,
    name: name,
    shortName: shortName,
    ports: c.Ports,
    volumes: c.Mounts.map(({Type, Name, Source}) => ({type: Type, name: Name, path: Source})),
    state: c.State,
    running: !/^Exited /i.test(c.Status),
  };
}

module.exports = {
  listContainers,
  runningPackagesInfo,
};
