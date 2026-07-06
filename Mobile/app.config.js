const IS_DEVELOPMENT = process.env.APP_VARIANT === 'development';

const APP_NAME = IS_DEVELOPMENT ? 'Knook Dev' : 'Knook';
const IOS_BUNDLE_IDENTIFIER = IS_DEVELOPMENT ? 'com.teamknook.knook.dev' : 'com.teamknook.knook';
const ANDROID_PACKAGE = IS_DEVELOPMENT ? 'com.teamknook.knook.dev' : 'com.teamknook.knook';
const SCHEME = IS_DEVELOPMENT ? 'knook-dev' : 'knook';

module.exports = {
  expo: {
    name: APP_NAME,
    slug: 'knook',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: SCHEME,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
      infoPlist: {
        NSContactsUsageDescription: 'Knook uses contacts only to help you privately add people you already know.',
      },
    },
    android: {
      package: ANDROID_PACKAGE,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-image.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#000000',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appVariant: IS_DEVELOPMENT ? 'development' : 'production',
      productionAppName: 'Knook',
      productionBundleIdentifier: 'com.teamknook.knook',
      productionScheme: 'knook',
    },
  },
};
