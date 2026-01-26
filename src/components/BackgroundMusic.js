'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic() {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isPausedByVideo, setIsPausedByVideo] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Attempt to play on first user interaction (browser policy)
        const handleFirstInteraction = () => {
            if (!isPlaying && !isMuted) {
                audio.play().catch(err => console.log("Autoplay prevented:", err));
                setIsPlaying(true);
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);

        // Listen for video play/pause events globally
        const handleVideoPlay = (e) => {
            if (e.target.tagName === 'VIDEO') {
                if (isPlaying && !audio.paused) {
                    audio.pause();
                    setIsPausedByVideo(true);
                }
            }
        };

        const handleVideoPause = (e) => {
            if (e.target.tagName === 'VIDEO') {
                if (isPausedByVideo && !isMuted) {
                    audio.play().catch(err => console.log("Resume prevented:", err));
                    setIsPausedByVideo(false);
                }
            }
        };

        document.addEventListener('play', handleVideoPlay, true);
        document.addEventListener('pause', handleVideoPause, true);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
            document.removeEventListener('play', handleVideoPlay, true);
            document.removeEventListener('pause', handleVideoPause, true);
        };
    }, [isPlaying, isMuted, isPausedByVideo]);

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMuted) {
            audio.muted = false;
            if (!isPausedByVideo) {
                audio.play().catch(err => console.log("Play error:", err));
            }
            setIsMuted(false);
        } else {
            audio.muted = true;
            setIsMuted(true);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <audio
                ref={audioRef}
                src="/music/background.mp3"
                loop
                preload="auto"
            />
            <button
                onClick={toggleMute}
                className="p-3 bg-[#11224E] text-white rounded-full shadow-lg hover:bg-[#1a3a7a] transition-all duration-300 flex items-center justify-center"
                title={isMuted ? "Activer la musique" : "Couper la musique"}
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className={isPlaying && !isPausedByVideo ? "animate-pulse" : ""} />}
            </button>
        </div>
    );
}
