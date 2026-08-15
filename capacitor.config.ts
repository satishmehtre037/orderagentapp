import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bizbot.os',
  appName: 'BizBot OS',
  webDir: 'out',
  server: {
    url: 'http://192.168.0.112:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
