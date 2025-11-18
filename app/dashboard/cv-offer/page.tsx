"use client";

import ProfileOfferAnalyzer from "@/components/ProfileOfferAnalyzer";

// ⭐ Mobile layout global
import MobileLayout from "@/components/MobileLayout";

export default function CvOfferPage() {
  return (
    <MobileLayout>
      <main className="min-h-screen bg-[#0A0A0A] text-white p-6 sm:p-10 flex justify-center">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-white">
            Analyze your CV or Job Offer
          </h1>

          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-6 sm:p-8">
            <ProfileOfferAnalyzer />
          </div>
        </div>
      </main>
    </MobileLayout>
  );
}
