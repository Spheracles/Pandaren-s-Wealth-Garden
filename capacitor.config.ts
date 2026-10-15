import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wealthgarden.app',
  appName: '財富花園',
  webDir: 'dist',
  // Native logs only in debug builds; release builds do not log bridge traffic
  // (which could contain financial values).
  loggingBehavior: 'debug',
  android: {
    allowMixedContent: false,
    captureInput: false,
    // left undefined on purpose: Capacitor enables WebView debugging only for debug builds
  },
  server: {
    androidScheme: 'https',
    // No `url`: the APK always runs the bundled web assets, never a remote site.
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
    SplashScreen: {
      launchAutoHide: false, // hidden by the app after the first render
      backgroundColor: '#070B14',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
