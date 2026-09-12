// jest-expo@57.0.5's setup.js uses stacktrace-js to look up custom
// project-local mocks for native modules (jest-expo/src/preset/setup.js,
// `attemptLookup`). In this environment stacktrace-js's synchronous stack
// parsing throws (`TypeError: The "path" argument must be of type string.
// Received null`) instead of returning an empty result, which crashes
// EVERY test suite before it starts — including ones with no native-module
// imports of their own, since jest-expo's own setup does this lookup for
// `ExpoFetchModule` unconditionally.
//
// This project has no custom native modules of its own — everything native
// comes from Expo's own SDK packages, which jest-expo mocks through a
// separate, working path (`ExpoModulesCore.requireOptionalNativeModule`,
// backed by its bundled `moduleMocks/*`). Stubbing `getSync` to return an
// empty stack makes `attemptLookup` take its normal "no custom mock found"
// branch instead of throwing, so that fallback path runs as intended.
module.exports = {
  getSync: () => [],
};
