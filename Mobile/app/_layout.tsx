import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { KnookBrandSplash } from "@/src/components";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { bootstrapFirebase } from "@/src/services/firebase/firebaseApp";
import { branchService } from "@/src/services/branch/branchService";
import { diagnostics } from "@/src/utils/diagnostics";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    diagnostics.log('root-layout-mounted');
    bootstrapFirebase();
    void branchService.init().catch((err) => diagnostics.error('branch-init-failed', err));
  }, []);

  useEffect(() => {
    diagnostics.log('navigation-root-font-state', { loaded, hasError: !!error });
    if (loaded || error) {
      SplashScreen.hideAsync().catch((err) => diagnostics.error('splash-hide-failed', err));
      const id = setTimeout(() => setShowBrandSplash(false), 1200);
      return () => clearTimeout(id);
    }
  }, [loaded, error]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!loaded && !error) return null;

  if (showBrandSplash) {
    return (
      <SafeAreaProvider>
        <KnookBrandSplash />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FAF8F5" } }} />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
