const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'node_modules', 'react-native-worklets');
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(
  path.join(dir, 'package.json'),
  JSON.stringify({ name: 'react-native-worklets', version: '0.0.1', main: 'index.js' })
);
fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports = {};\n');
fs.writeFileSync(
  path.join(dir, 'plugin.js'),
  'module.exports = function () { return { visitor: {} }; };\n'
);

console.log('✓ react-native-worklets stub created');
