import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook to wrap browser SpeechRecognition / webkitSpeechRecognition API
 * and provide clean callbacks and support checks.
 */
export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      Promise.resolve().then(() => {
        setIsSupported(true);
      });
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        const segments = [];
        for (let i = 0; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            segments.push(text);
          }
        }

        // Deduplicate cumulative segments (common in mobile Web Speech API)
        const finalSegments = [];
        for (let i = 0; i < segments.length; i++) {
          const current = segments[i];
          let isDuplicate = false;
          for (let j = i + 1; j < segments.length; j++) {
            const next = segments[j];
            if (next.toLowerCase().includes(current.toLowerCase())) {
              isDuplicate = true;
              break;
            }
          }
          if (!isDuplicate) {
            finalSegments.push(current);
          }
        }

        setTranscript(finalSegments.join(" "));
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    try {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Start speech failed:", err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error("Stop speech failed:", err);
    }
  }, [isSupported]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
};
export default useSpeechToText;
