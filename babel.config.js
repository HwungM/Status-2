const path = require('path')
const fs = require('fs')

// Create react-native-worklets stub before any babel preset can require it.
// babel-preset-expo with expo-router pulls in reanimated which requires this.
const stubDir = path.join(__dirname, 'node_modules', 'react-native-worklets')
if (!fs.existsSync(path.join(stubDir, 'plugin.js'))) {
  fs.mkdirSync(stubDir, { recursive: true })
  fs.writeFileSync(path.join(stubDir, 'package.json'), JSON.stringify({ name: 'react-native-worklets', version: '0.0.1', main: 'index.js' }))
  fs.writeFileSync(path.join(stubDir, 'index.js'), 'module.exports = {};\n')
  fs.writeFileSync(path.join(stubDir, 'plugin.js'), 'module.exports = function () { return { visitor: {} }; };\n')
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: false }],
      'nativewind/babel',
    ],
    plugins: [],
  };
};

