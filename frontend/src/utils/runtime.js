import { Capacitor } from '@capacitor/core';

export const getPlatform = () => Capacitor.getPlatform();

export const isNativeApp = () => Capacitor.isNativePlatform();

export const isAndroidApp = () => isNativeApp() && getPlatform() === 'android';

export const getRuntimeInfo = () => ({
  platform: getPlatform(),
  isNativeApp: isNativeApp(),
  isAndroidApp: isAndroidApp(),
});
