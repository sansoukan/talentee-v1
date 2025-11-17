import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.talentee.app",
  appName: "Talentee",
  webDir: ".next",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  }
};

export default config;