const fs = require('fs');
const path = require('path');
const { withPodfile } = require('@expo/config-plugins');

const APP_VARIANT = process.env.APP_VARIANT || 'development';
const AUTH_PROVIDER = process.env.AUTH_PROVIDER || 'preview';
const FIREBASE_AUTH_TARGET = process.env.FIREBASE_AUTH_TARGET || 'development';
const FIRESTORE_TARGET = process.env.FIRESTORE_TARGET || 'development';
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;

const variants = {
  development: {
    name: 'Knook Dev',
    iosBundleIdentifier: 'com.teamknook.knook.dev',
    androidPackage: 'com.teamknook.knook.dev',
    scheme: 'knook-dev',
    firebaseDir: 'development',
  },
  preview: {
    name: 'Knook Preview',
    iosBundleIdentifier: 'com.teamknook.knook.preview',
    androidPackage: 'com.teamknook.knook.preview',
    scheme: 'knook-preview',
    firebaseDir: 'preview',
  },
  production: {
    name: 'Knook',
    iosBundleIdentifier: 'com.teamknook.knook',
    androidPackage: 'com.teamknook.knook',
    scheme: 'knook',
    firebaseDir: 'production',
  },
};

const variant = variants[APP_VARIANT] || variants.development;
const firebaseDir = path.join(__dirname, 'firebase', variant.firebaseDir);
const iosGoogleServicesFile = path.join(firebaseDir, 'GoogleService-Info.plist');
const androidGoogleServicesFile = path.join(firebaseDir, 'google-services.json');
const hasIosFirebaseConfig = fs.existsSync(iosGoogleServicesFile);
const hasAndroidFirebaseConfig = fs.existsSync(androidGoogleServicesFile);
const hasPackage = (packageName) => {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
};
const firebasePlugins = AUTH_PROVIDER === 'firebase'
  ? ['@react-native-firebase/app', '@react-native-firebase/auth']
  : [];
const firebaseBuildPlugins = AUTH_PROVIDER === 'firebase' && hasPackage('expo-build-properties')
  ? [[
      'expo-build-properties',
      {
        ios: {
          buildReactNativeFromSource: true,
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBAuth', 'RNFBFirestore'],
        },
      },
    ]]
  : [];

const withKnookIosPodBuildPatches = (config) => withPodfile(config, (modConfig) => {
  const patchMarker = '# Knook: Xcode 26 fmt build compatibility';
  let podfile = modConfig.modResults.contents;

  if (podfile.includes(patchMarker)) {
    return modConfig;
  }

  const podBuildPatch = [
    '',
    `    ${patchMarker}`,
    "    installer.pods_project.targets.each do |target|",
    "      next unless target.name == 'fmt'",
    '',
    "      target.build_configurations.each do |build_config|",
    "        build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++17'",
    '      end',
    '    end',
  ].join('\n');

  const postInstallEnd = '  end\nend';

  if (podfile.includes(postInstallEnd)) {
    podfile = podfile.replace(postInstallEnd, `${podBuildPatch}\n  end\nend`);
    modConfig.modResults.contents = podfile;
  }

  return modConfig;
});

const iosCompatibilityPlugins = AUTH_PROVIDER === 'firebase'
  ? [withKnookIosPodBuildPatches]
  : [];

const config = {
  expo: {
    name: variant.name,
    slug: 'knook',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: variant.scheme,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: variant.iosBundleIdentifier,
      ...(APPLE_TEAM_ID ? { appleTeamId: APPLE_TEAM_ID } : {}),
      entitlements: {
        'keychain-access-groups': [
          `$(AppIdentifierPrefix)${variant.iosBundleIdentifier}`,
        ],
      },
      ...(hasIosFirebaseConfig ? { googleServicesFile: iosGoogleServicesFile } : {}),
      infoPlist: {
        NSContactsUsageDescription: 'Knook uses contacts only to help you privately add people you already know.',
      },
    },
    android: {
      package: variant.androidPackage,
      ...(hasAndroidFirebaseConfig ? { googleServicesFile: androidGoogleServicesFile } : {}),
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
      ...firebasePlugins,
      ...firebaseBuildPlugins,
      ...iosCompatibilityPlugins,
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F5F4EF',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appVariant: APP_VARIANT,
      authProvider: AUTH_PROVIDER,
      firebaseAuthTarget: FIREBASE_AUTH_TARGET,
      firestoreTarget: FIRESTORE_TARGET,
      firebaseConfigPresent: {
        ios: hasIosFirebaseConfig,
        android: hasAndroidFirebaseConfig,
      },
      productionAppName: 'Knook',
      productionBundleIdentifier: 'com.teamknook.knook',
      productionScheme: 'knook',
      appleTeamIdConfigured: Boolean(APPLE_TEAM_ID),
    },
  },
};

module.exports = config;
