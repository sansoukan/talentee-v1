import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.talentee.app",
  appName: "Talentee",
  webDir: "dist", // pas utilisé, mais requis par Capacitor
  server: {
    url: "https://talentee-v1-xc1r-mnajky4ct-redas-projects-e5a9d162.vercel.app",
    cleartext: true,
  },
};

export default config;