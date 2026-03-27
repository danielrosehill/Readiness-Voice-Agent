const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve "browser" conditional exports so @google/genai uses its web build
// (which uses standard WebSocket, compatible with React Native)
config.resolver.conditionNames = ['browser', 'require', 'import', 'default'];

module.exports = config;
