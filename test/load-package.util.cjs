const { createRequire } = require('module');
const req = createRequire(__filename);

const packageCache = new Map();

function loadPackageSync(packageName, context, loaderFn) {
  const cached = packageCache.get(packageName);
  if (cached) return cached;
  try {
    const pkg = loaderFn ? loaderFn() : req(packageName);
    packageCache.set(packageName, pkg);
    return pkg;
  } catch (e) {
    throw e;
  }
}

async function loadPackage(packageName, context, loaderFn) {
  return loadPackageSync(packageName, context, loaderFn);
}

function loadPackageCached(packageName, context) {
  const cached = packageCache.get(packageName);
  if (cached) return cached;
  return loadPackageSync(packageName, context);
}

async function tryLoadPackage(packageName, loaderFn) {
  try {
    return loaderFn ? await loaderFn() : req(packageName);
  } catch {
    return null;
  }
}

module.exports = {
  loadPackage,
  loadPackageSync,
  loadPackageCached,
  tryLoadPackage,
};
