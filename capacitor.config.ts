import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agento.ai',
  appName: 'Agento AI',
  webDir: 'out',
  server: {
    url: 'https://orderagentapp.webcorestudio.dev',
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
