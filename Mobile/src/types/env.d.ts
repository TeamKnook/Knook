declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_BACKEND_URL?: string;
    readonly EXPO_PUBLIC_DEMO_MODE?: string;
    readonly EXPO_PUBLIC_FB_API_KEY?: string;
    readonly EXPO_PUBLIC_FB_AUTH_DOMAIN?: string;
    readonly EXPO_PUBLIC_FB_PROJECT_ID?: string;
    readonly EXPO_PUBLIC_FB_STORAGE_BUCKET?: string;
    readonly EXPO_PUBLIC_FB_MESSAGING_SENDER_ID?: string;
    readonly EXPO_PUBLIC_FB_APP_ID?: string;
    readonly EXPO_PUBLIC_BRANCH_KEY?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

