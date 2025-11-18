"use client";

import SettingsPanel from "@/components/SettingsPanel";
import SettingsToast from "@/components/SettingsToast";

// ⭐ Mobile Layout global
import MobileLayout from "@/components/MobileLayout";

export default function SettingsPage() {
  return (
    <MobileLayout>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white 
                      p-6 sm:p-8 flex flex-col items-center">

        <div className="w-full max-w-5xl mt-6 sm:mt-10">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-8 tracking-tight">
            Settings
          </h1>

          {/* Settings panel */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-8 backdrop-blur-xl">
            <SettingsPanel />
          </div>
        </div>

        {/* Toast */}
        <SettingsToast />
      </main>
    </MobileLayout>
  );
}
