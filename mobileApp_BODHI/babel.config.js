module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
    // 'react-native-reanimated/plugin' <-- Keep this if it's already there
  ],
};