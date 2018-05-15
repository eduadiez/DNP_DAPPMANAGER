
const dockerCalls = require('../modules/calls/dockerCalls')
const dependenciesTools = require('../modules/tools/dependenciesTools')
const PackageInstaller = require('../modules/PackageInstaller')
const emitter = require('../modules/emitter')
const fs = require('fs')
const getPath = require('../utils/getPath')

const { stringifyEnvs } = require('../utils/parse')
const packagesUtils = require('./packagesUtils')

const params = require('../params')
const REPO_DIR = params.REPO_DIR
const ENV_FILE_EXTENSION = params.ENV_FILE_EXTENSION


function createInstallPackage(params) {

  // Construct single package downloader and runner
  const download = packagesUtils.createDownload(params, ipfsCalls, generate, fs)
  const run = packagesUtils.createrun(params, dockerCalls, docker_compose)
  // Construct a multiple package downloader and runner with previous functions
  const downloadPackages = packagesUtils.createDownloadPackages(download)
  const runPackages = packagesUtils.createRunPackages(run)

  return async function installPackage(req) {

    let packageReq = utils.parsePackageReq(req[0])
    let envs = JSON.parse(req[1])

    // If requested package is already running, throw error
    if (await packageIsAlreadyRunning(packageReq.name)) {
      throw Error("Package already running")
    }

    // This shoud be moved somewhere
    async function fetchDependencies(packageReq) {
      let dnpManifest = await getManifest(packageReq);
      return dnpManifest.dependencies;
    }

    // Returns a list of unique dep (highest requested version) + requested package
    // > fetchDependencies needs IPFS
    let allResolvedDeps = await getAllResolvedDeps(packageReq, fetchDependencies)
    // Return an order to follow in order to install repecting dependencies
    let packageListOrdered = orderDependecies(allResolvedDeps)

    // -> install in paralel
    await downloadPackages(packageListOrdered)
    // -> run in serie
    await runPackages(packageListOrdered)

    return await Promise.all(packageInstallerPromiseArray).then(packageList => {
      return JSON.stringify({
          success: true,
          message: 'Completed the installation of ' + packageReq.req
      })
    })
  }
}


///////////////////////////////
// Helper functions

async function downloadPackagesInParalel() {

}


async function packageIsAlreadyRunning(packageName) {

  let runningPackages = await dockerCalls.runningPackagesInfo()
  return (packageName in runningPackages)

}

function getPackageIncompatibilities(packagesToInstall) {

  // TODO
  // - Verify port collision
  // - Existance of volumes

}




module.exports = createInstallPackage
