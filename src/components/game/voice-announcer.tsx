"use client";

import { useEffect, useRef, useCallback } from "react";

// Preferred female voices in order of preference
const PREFERRED_FEMALE_VOICES = [
  "Google UK English Female",
  "Google US English Female",
  "Microsoft Zira",
  "Microsoft Hazel",
  "Samantha",
  "Victoria",
  "Karen",
  "Moira",
  "Tessa",
  "Fiona",
  "Veena",
];

export function useVoiceAnnouncer() {
  const synth = useRef<SpeechSynthesis | null>(null);
  const selectedVoice = useRef<SpeechSynthesisVoice | null>(null);
  const voicesLoaded = useRef(false);

  // Find the best female voice available
  const findBestFemaleVoice = useCallback(() => {
    if (!synth.current) return null;

    const voices = synth.current.getVoices();
    if (voices.length === 0) return null;

    // Try to find a preferred female voice
    for (const preferredName of PREFERRED_FEMALE_VOICES) {
      const voice = voices.find(v =>
        v.name.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (voice) return voice;
    }

    // Fallback: try to find any voice with "female" in the name
    const femaleVoice = voices.find(v =>
      v.name.toLowerCase().includes("female")
    );
    if (femaleVoice) return femaleVoice;

    // Fallback: try common female voice patterns
    const commonFemale = voices.find(v =>
      v.name.includes("Zira") ||
      v.name.includes("Hazel") ||
      v.name.includes("Susan") ||
      v.name.includes("Linda") ||
      v.name.includes("Catherine")
    );
    if (commonFemale) return commonFemale;

    // Default to first English voice
    const englishVoice = voices.find(v => v.lang.startsWith("en"));
    return englishVoice || voices[0];
  }, []);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window === "undefined") return;

    synth.current = window.speechSynthesis;

    // Load voices
    const loadVoices = () => {
      selectedVoice.current = findBestFemaleVoice();
      voicesLoaded.current = true;
      console.log("Selected voice:", selectedVoice.current?.name);
    };

    // Voices may not be loaded immediately
    if (synth.current.getVoices().length > 0) {
      loadVoices();
    } else {
      synth.current.addEventListener("voiceschanged", loadVoices);
    }

    return () => {
      synth.current?.removeEventListener("voiceschanged", loadVoices);
    };
  }, [findBestFemaleVoice]);

  // Announce a number
  const announceNumber = useCallback((number: number) => {
    if (!synth.current) return;

    // Cancel any ongoing speech
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(`Number ${number}`);

    // Configure for sharp, clear female voice
    utterance.rate = 0.9;
    utterance.pitch = 1.2; // Slightly higher pitch for sharper tone
    utterance.volume = 1.0;

    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }

    synth.current.speak(utterance);
  }, []);

  // Announce winner
  const announceWinner = useCallback((winnerName: string, prizeName: string) => {
    if (!synth.current) return;

    synth.current.cancel();

    const text = `Congratulations ${winnerName}! You have won ${prizeName}!`;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.85;
    utterance.pitch = 1.15;
    utterance.volume = 1.0;

    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }

    synth.current.speak(utterance);
  }, []);

  // Announce game started
  const announceGameStart = useCallback(() => {
    if (!synth.current) return;

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance("Game has started! Good luck everyone!");

    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;

    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }

    synth.current.speak(utterance);
  }, []);

  // Announce game paused
  const announceGamePaused = useCallback(() => {
    if (!synth.current) return;

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance("Game paused");

    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;

    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }

    synth.current.speak(utterance);
  }, []);

  // Announce game resumed
  const announceGameResumed = useCallback(() => {
    if (!synth.current) return;

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance("Game resumed! Let's continue!");

    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;

    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }

    synth.current.speak(utterance);
  }, []);

  // Announce game ended
  const announceGameEnd = useCallback(() => {
    if (!synth.current) return;

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance("Game over! Thank you for playing!");

    utterance.rate = 0.85;
    utterance.pitch = 1.15;
    utterance.volume = 1.0;

    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }

    synth.current.speak(utterance);
  }, []);

  // General text announcement
  const announceText = useCallback((text: string) => {
    if (!synth.current) return;

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.15;
    utterance.volume = 1.0;

    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }

    synth.current.speak(utterance);
  }, []);

  // Stop any ongoing speech
  const stopSpeaking = useCallback(() => {
    if (synth.current) {
      synth.current.cancel();
    }
  }, []);

  return {
    announceNumber,
    announceWinner,
    announceGameStart,
    announceGamePaused,
    announceGameResumed,
    announceGameEnd,
    announceText,
    stopSpeaking,
  };
}
