'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function BackgroundMusic({ initialSettings }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isPausedByVideo, setIsPausedByVideo] = useState(false);
    const [musicSettings, setMusicSettings] = useState(initialSettings);

    useEffect(() => {
        // If we don't have settings, or for refreshing them, fetch again
        // But with initialSettings, this prevents the "Default Music" flicker
        if (!initialSettings) {
            fetch('/api/admin/settings')
                .then(res => res.json())
                .then(data => {
                    if (data.bgMusic) setMusicSettings(data.bgMusic);
                })
                .catch(err => console.error("Erreur chargement musique", err));
        }

        const handleSettingsUpdate = (e) => {
            if (e.detail?.bgMusic) {
                setMusicSettings(e.detail.bgMusic);
            }
        };

        window.addEventListener('settings-updated', handleSettingsUpdate);
        return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
    }, [initialSettings]);

    // Sync volume whenever settings change
    useEffect(() => {
        if (audioRef.current && musicSettings) {
            audioRef.current.volume = musicSettings.volume !== undefined ? musicSettings.volume : 0.5;
        }
    }, [musicSettings]);

    const hasTriedAutoplay = useRef(false);

    // Auto-play attempt ONLY when music settings first load
    useEffect(() => {
        if (!musicSettings || hasTriedAutoplay.current) return;
        hasTriedAutoplay.current = true;

        if (audioRef.current && !isMuted) {
            audioRef.current.play().catch(() => {
                // Expected if browser blocks autoplay before user interaction
            });
        }
    }, [musicSettings]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleInteraction = () => {
            if (audioRef.current && audioRef.current.paused && !isMuted && !isPausedByVideo) {
                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                        document.removeEventListener('click', handleInteraction);
                        document.removeEventListener('touchstart', handleInteraction);
                        document.removeEventListener('keydown', handleInteraction);
                    })
                    .catch(err => console.log("Interaction play failed:", err));
            }
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
        
        const handleVideoPlay = (e) => {
            if (e.target.tagName === 'VIDEO' && audioRef.current) {
                if (!audioRef.current.paused) {
                    audioRef.current.pause();
                    setIsPausedByVideo(true);
                }
            }
        };

        const handleVideoPause = (e) => {
            if (e.target?.tagName === 'VIDEO' && audioRef.current) {
                if (isPausedByVideo && !isMuted) {
                    audioRef.current.play().catch(err => console.log("Resume prevented:", err));
                    setIsPausedByVideo(false);
                }
            }
        };

        const forcePause = () => {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                setIsPausedByVideo(true);
            }
        };

        const forcePlay = () => {
            if (audioRef.current && isPausedByVideo && !isMuted) {
                audioRef.current.play().catch(err => console.log("Resume prevented:", err));
                setIsPausedByVideo(false);
            }
        };

        document.addEventListener('play', handleVideoPlay, true);
        document.addEventListener('pause', handleVideoPause, true);
        window.addEventListener('stop-bg-music', forcePause);
        window.addEventListener('play-bg-music', forcePlay);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('play', handleVideoPlay, true);
            document.removeEventListener('pause', handleVideoPause, true);
            window.removeEventListener('stop-bg-music', forcePause);
            window.removeEventListener('play-bg-music', forcePlay);
        };
    }, [isMuted, isPausedByVideo]);

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

    const getActiveTrackUrl = () => {
        if (!musicSettings) return ""; // No track yet
        if (!musicSettings.playlist || musicSettings.playlist.length === 0) return "/music/background.mp3";
        const track = musicSettings.playlist.find(t => t.id === musicSettings.activeTrackId);
        return track ? track.url : "/music/background.mp3";
    };

    const currentUrl = getActiveTrackUrl();

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '25px',
            zIndex: 9999
        }}>
            {currentUrl && (
                <audio
                    id="bg-music-player"
                    ref={audioRef}
                    src={currentUrl}
                    loop
                    autoPlay
                    preload="auto"
                    onPlay={() => {
                        setIsPlaying(true);
                        setIsPausedByVideo(false);
                    }}
                    onPause={() => setIsPlaying(false)}
                />
            )}
            
            {musicSettings && (
                <button
                    onClick={toggleMute}
                    style={{
                        padding: '12px',
                        background: '#11224E',
                        color: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        border: '2px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1a3a7a'}
                    onMouseOut={e => e.currentTarget.style.background = '#11224E'}
                    title={isMuted ? "Activer la musique" : "Couper la musique"}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className={isPlaying && !isPausedByVideo ? "pulse-animation" : ""} />}
                </button>
            )}

            <style jsx>{`
                .pulse-animation {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
}
