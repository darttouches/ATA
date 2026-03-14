"use client";

import { useEffect, useState } from 'react';
import { Calendar, PlayCircle, X, ExternalLink, Radio } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';

export default function AtaWavesPage() {
    const { t, language } = useLanguage();
    const [episodes, setEpisodes] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedEpisode, setSelectedEpisode] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch general ATA Waves settings (logo, description)
                const settingsRes = await fetch('/api/admin/settings');
                const settingsData = await settingsRes.json();
                setSettings(settingsData?.ataWaves || null);

                // Fetch episodes
                const epRes = await fetch('/api/ata-waves-episodes');
                const epData = await epRes.json();
                setEpisodes(epData);
            } catch (error) {
                console.error('Failed to fetch ATA Waves data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle background music pause/play when modal opens
    useEffect(() => {
        if (selectedEpisode) {
            // Un peu de délai pour s'assurer que ça s'exécute après le nettoyage précédent
            setTimeout(() => {
                const audio = document.getElementById('bg-music-player');
                if (audio && !audio.paused) {
                    audio.dataset.pausedByModal = 'true';
                    audio.pause();
                }
            }, 100);
        } else {
            const audio = document.getElementById('bg-music-player');
            if (audio && audio.dataset.pausedByModal === 'true') {
                audio.play().catch(e => console.log('play prevented', e));
                audio.dataset.pausedByModal = 'false';
            }
        }
    }, [selectedEpisode]);

    // Helper to generate embed URLs
    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtu.be') ? url.split('youtu.be/')[1] : url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
        if (url.includes('facebook.com') && (url.includes('/video') || url.includes('/watch') || url.includes('/reel'))) {
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`;
        }
        if (url.includes('tiktok.com')) {
            // Matches /video/1234567890 or @user/video/1234567890 or vm.tiktok won't have it
            const match = url.match(/video\/(\d+)/);
            if (match) {
                return `https://www.tiktok.com/embed/v2/${match[1]}?lang=${language}`;
            } else {
                return 'tiktok-unsupported-shortlink'; // Special flag to show message
            }
        }
        if (url.includes('instagram.com/reel') || url.includes('instagram.com/p/')) {
            const match = url.split("?")[0];
            const cleanMatch = match.endsWith('/') ? match : match + '/';
            return `${cleanMatch}embed/`;
        }
        // Fallback to original URL
        return url;
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
                <div style={{ padding: '4rem', opacity: 0.5 }}>{t('loading') || 'Chargement...'}</div>
            </div>
        );
    }

    // Hide if not published
    if (settings && !settings.isPublished) {
        return (
            <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
                <div className="card" style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto', border: '1px dashed var(--card-border)' }}>
                    <h2>{t('contentNotAvailable')}</h2>
                    <p style={{ opacity: 0.7 }}>{t('pageNotPublished')}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Hero Section */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(to bottom, var(--card-bg), var(--bg))',
                padding: '6rem 1rem 4rem 1rem',
                borderBottom: '1px solid var(--card-border)',
                textAlign: 'center'
            }}>
                <div className="container">
                    {settings?.logo ? (
                        <div style={{ width: '150px', height: '150px', margin: '0 auto 1.5rem auto', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', padding: '15px', border: '2px solid rgba(244, 63, 94, 0.3)', boxShadow: '0 0 40px rgba(244, 63, 94, 0.2)', position: 'relative' }}>
                            <Image src={settings.logo} alt="ATA Waves Logo" fill style={{ objectFit: 'contain', padding: '15px' }} />
                        </div>
                    ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', margin: '0 auto 1.5rem auto', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--primary)', border: '2px solid rgba(244, 63, 94, 0.3)' }}>
                            <Radio size={50} />
                        </div>
                    )}
                    
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-1px' }}>
                        ATA <span style={{ color: 'var(--primary)' }}>Waves</span>
                    </h1>
                    
                    {settings?.description && (
                        <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
                            {settings.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Episodes Grid */}
            <div className="container" style={{ padding: '4rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {t('latestEpisodes')}
                    </h2>
                    <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>{episodes.length} {t('episodesCount')}</div>
                </div>

                {episodes.length === 0 ? (
                    <div className="card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--card-border)' }}>
                        {t('noEpisodes')}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                        {episodes.map(ep => (
                            <div 
                                key={ep._id} 
                                className="card" 
                                style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}
                                onClick={() => setSelectedEpisode(ep)}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Thumbnail */}
                                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
                                    {ep.coverImage ? (
                                        <Image src={ep.coverImage} alt={ep.title} fill style={{ objectFit: 'cover', opacity: 0.8, transition: '0.5s ease' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'linear-gradient(45deg, #11224E, #1a367a)' }}>
                                            <Radio size={40} opacity={0.3} />
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.3s ease' }} className="play-overlay">
                                        <PlayCircle size={64} color="var(--primary)" />
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <PlayCircle size={12} /> {t('video')}
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {ep.title}
                                    </h3>
                                    
                                    <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', opacity: 0.7, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {ep.description}
                                    </p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', opacity: 0.6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Radio size={14} /> {ep.animator || t('teamAta')}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} /> {new Date(ep.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : (language === 'en' ? 'en-US' : 'fr-FR'))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {selectedEpisode && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex',
                    flexDirection: 'column', padding: '20px', overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '15px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                        <button 
                            onClick={() => setSelectedEpisode(null)} 
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1000px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            {getEmbedUrl(selectedEpisode.videoUrl) === 'tiktok-unsupported-shortlink' ? (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #11224E, #1a367a)', padding: '20px' }}>
                                    <PlayCircle size={64} style={{ marginBottom: '20px', color: '#ff0050' }} />
                                    <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>Lien TikTok Court détecté</h3>
                                    <p style={{ opacity: 0.8, marginBottom: '20px', textAlign: 'center', maxWidth: '500px', fontSize: '0.9rem' }}>
                                        TikTok bloque l&apos;intégration de ses liens courts (vm.tiktok). <br/><br/>
                                        <strong>Option 1 :</strong> Ouvrez ce lien sur votre navigateur, copiez le <span style={{color:'var(--primary)'}}>lien complet</span> qui apparait avec le numéro de la vidéo et mettez à jour cette émission pour l&apos;afficher ici.<br/>
                                        <strong>Option 2 :</strong> Cliquez directement sur le bouton ci-dessous pour visionner sur TikTok !
                                    </p>
                                    <a href={selectedEpisode.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ff0050', border: 'none' }}>
                                        <ExternalLink size={18} /> Voir sur TikTok
                                    </a>
                                </div>
                            ) : getEmbedUrl(selectedEpisode.videoUrl).includes('embed') || getEmbedUrl(selectedEpisode.videoUrl).includes('video.php') ? (
                                <iframe 
                                    src={getEmbedUrl(selectedEpisode.videoUrl)}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #11224E, #1a367a)' }}>
                                    <PlayCircle size={64} style={{ marginBottom: '20px', color: 'var(--primary)' }} />
                                    <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>{t('unsupportedPlayer')}</h3>
                                    <p style={{ opacity: 0.6, marginBottom: '20px', textAlign: 'center', maxWidth: '400px' }}>
                                        {t('openVideoDirectly')}
                                    </p>
                                    <a href={selectedEpisode.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ExternalLink size={18} /> {t('openVideoBtn')}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div style={{ width: '100%', marginTop: '30px', padding: '0 20px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>{selectedEpisode.title}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', opacity: 0.7, marginBottom: '20px' }}>
                                <span>{t('publishedOn')} {new Date(selectedEpisode.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : (language === 'en' ? 'en-US' : 'fr-FR'))}</span>
                                <span>•</span>
                                <span>{selectedEpisode.animator || t('teamAta')}</span>
                            </div>
                            <p style={{ opacity: 0.8, maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                                {selectedEpisode.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
