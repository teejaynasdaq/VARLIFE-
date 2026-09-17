const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Required for Firebase v10+ with Metro
config.resolver.sourceExts.push("cjs", "mjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
