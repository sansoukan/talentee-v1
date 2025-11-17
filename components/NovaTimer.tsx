"use client";

import { useEffect, useState } from "react";

/**
 * NovaTimer V3.1 — Visual + Vocal Session Timer
 * ----------------------------------------------
 * ⏱️ Affiche le temps restant (min:sec)
 * 🔊 Déclenche alertes vocales T-2 et T-30
 * 🎨 Barre de progression + couleurs dynamiques
 * ✅ Requiert totalMinutes & callbacks onPreclose / onClose / onHardStop
 */

type Props = {
  totalMinutes: number; // durée totale de la session
  onPreclose?: () => void; // callback T-3
  onClose?: () => void; // callback T-2
  onHardStop?: () => void; // callback T-30s
};

export default function NovaTimer({
  totalMinutes,
  onPreclose,
  onClose,
  onHardStop,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);
  const [triggered, setTriggered] = useState({
    preclose: false,
    close: false,
    hardstop: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = Math.max(prev - 1, 0);

        // T-3 min
        if (!triggered.preclose && next <= 180 && next > 120) {
          setTriggered((p) => ({ ...p, preclose: true }));
          onPreclose?.();
        }

        // T-2 min
        if (!triggered.close && next <= 120 && next > 30) {
          setTriggered((p) => ({ ...p, close: true }));
          onClose?.();

          const msg = new SpeechSynthesisUtterance(
            "You have two minutes remaining."
          );
          msg.lang = "en-US";
          window.speechSynthesis.speak(msg);
        }

        // T-30s
        if (!triggered.hardstop && next <= 30) {
          setTriggered((p) => ({ ...p, hardstop: true }));
          onHardStop?.();

          const msg = new SpeechSynthesisUtterance(
            "Thirty seconds remaining."
          );
          msg.lang = "en-US";
          window.speechSynthesis.speak(msg);
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onPreclose, onClose, onHardStop, triggered]);

  // Calcul progression
  const totalSeconds = totalMinutes * 60;
  const percent = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));

  // Couleur dynamique
  let barColor = "bg-green-500";
  if (secondsLeft <= 180 && secondsLeft > 120) barColor = "bg-yellow-400";
  if (secondsLeft <= 120 && secondsLeft > 30) barColor = "bg-orange-500";
  if (secondsLeft <= 30) barColor = "bg-red-600 animate-pulse";

  // Format mm:ss
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div
      className="fixed bottom-6 right-6 w-56 bg-black/60 border border-gray-700 rounded-xl p-3 shadow-lg backdrop-blur-sm select-none"
      style={{ zIndex: 50 }}
    >
      <div className="text-xs text-gray-400 mb-1">⏱️ Time remaining</div>
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold text-white tabular-nums">
          {mm}:{ss}
        </div>
        <span
          className={`text-xs font-semibold ${
            secondsLeft <= 120
              ? "text-red-400"
              : secondsLeft <= 180
              ? "text-yellow-300"
              : "text-green-400"
          }`}
        >
          {percent.toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}