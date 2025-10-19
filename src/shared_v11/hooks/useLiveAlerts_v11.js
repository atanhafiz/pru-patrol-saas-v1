// PRU Patrol Sandbox v1.1 – Live Alerts Hook
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export function useLiveAlertsV11(data, label = "update") {
  const prevCount = useRef(data?.length || 0);

  useEffect(() => {
    if (!data) return;
    if (data.length > prevCount.current) {
      // Create a simple beep sound using Web Audio API
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (error) {
        console.log("Audio not supported, skipping sound");
      }
      
      toast.success(`🔔 New ${label} received!`);
    }
    prevCount.current = data.length;
  }, [data]);
}
