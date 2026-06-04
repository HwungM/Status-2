const path = require('path')
const Module = require('module')

// Redirect react-native-worklets to our local stub at the Node resolver level.
// This runs in the Metro transform worker before any preset can fail on it.
const stubDir = path.resolve(__dirname, 'stubs', 'react-native-worklets')
const _orig = Module._resolveFilename.bind(Module)
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'react-native-worklets') return path.join(stubDir, 'index.js')
  if (request === 'react-native-worklets/plugin') return path.join(stubDir, 'plugin.js')
  return _orig(request, parent, isMain, options)
}

module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: false }],
      'nativewind/babel',
    ],
    plugins: [],
  }
}


