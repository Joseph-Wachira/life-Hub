// Explicit (rather than implicit/default) Metro config so the monorepo
// setup is visible and has a home for future customization. Expo SDK 52+
// auto-detects the npm workspaces root from here — no manual
// watchFolders/nodeModulesPaths wiring needed (see
// https://docs.expo.dev/guides/monorepos/).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
