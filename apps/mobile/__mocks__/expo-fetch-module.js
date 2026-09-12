// jest-expo@57.0.5's own setup.js already stubs `globalThis.expo.modules.ExpoFetchModule`
// for exactly this case, but the native-module mock lookup it falls back to
// (an internal stack-trace-walking heuristic in jest-expo/src/preset/setup.js)
// throws instead of returning null in this monorepo layout, crashing every
// test suite before it starts (even ones with no imports of their own).
// Mapping the module straight to this stub sidesteps that lookup entirely.
// Shape mirrors jest-expo's own intended stub (see setup.js) since
// expo/src/winter/fetch/FetchResponse.ts subclasses NativeResponse.
class StubSharedObject {}

module.exports = {
  ExpoFetchModule: {
    NativeRequest: class extends StubSharedObject {
      start() {}
      cancel() {}
    },
    NativeResponse: class extends StubSharedObject {
      startStreaming() {}
      cancelStreaming() {}
      arrayBuffer() {}
      text() {}
    },
  },
};
