import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bizbot.os',
  appName: 'BizBot OS',
  webDir: 'out',
  server: {
    url: 'https://orderagentapp.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
