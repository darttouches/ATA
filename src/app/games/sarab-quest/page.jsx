'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScanLine, Map, Lightbulb, Trophy, LogOut, ArrowRight, AlertCircle, CheckCircle2, Navigation, Wifi, Fingerprint, Lock, MapPin, FileText } from 'lucide-react';
import styles from './phygital.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function PhygitalGuestPlayerPage() {
    const { t, language } = useLanguage();
    const [accessCode, setAccessCode] = useState('');
    const [activeTab, setActiveTab] = useState('clues');
    const [teamSession, setTeamSession] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [gameStateData, setGameStateData] = useState(null);

    // Play state
    const [answer, setAnswer] = useState('');
    const [selectedChoices, setSelectedChoices] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isChecking, setIsChecking] = useState(false);

    // Map Panning state
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const mapViewportRef = require('react').useRef(null);
    
    // Auth Check
    const [currentUserRole, setCurrentUserRole] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('sarabSession');
        if (stored) {
            const data = JSON.parse(stored);
            setTeamSession(data);
            fetchGameState(data.teamId);
        }
        
        // Check if current browser session belongs to an admin
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data && data.role) {
                    setCurrentUserRole(data.role);
                }
            })
            .catch(err => console.log('Not an admin / not logged in'));
    }, []);

    const fetchGameState = async (teamId) => {
        try {
            const res = await fetch(`/api/games/sarab-quest/player/state?teamId=${teamId}`);
            const data = await res.json();
            if (data.success) {
                setGameState(data.data.gameState);
                setGameStateData(data.data);
            } else {
                localStorage.removeItem('sarabSession');
                setTeamSession(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Auto-center map on current active node 
    useEffect(() => {
        if (activeTab === 'map' && gameStateData && mapViewportRef.current) {
            const currentMap = gameStateData.mapTexture || 'map_general';
            const MapLayouts = {
                map_general: [{ x: 65, y: 25 }, { x: 35, y: 35 }, { x: 48, y: 65 }, { x: 75, y: 75 }, { x: 50, y: 85 }, { x: 20, y: 70 }, { x: 15, y: 40 }, { x: 40, y: 20 }, { x: 80, y: 40 }, { x: 85, y: 65 }, { x: 65, y: 90 }, { x: 30, y: 90 }, { x: 10, y: 55 }, { x: 25, y: 20 }, { x: 55, y: 15 }, { x: 85, y: 25 }, { x: 90, y: 50 }],
                map_desert: [{ x: 80, y: 20 }, { x: 50, y: 40 }, { x: 30, y: 60 }, { x: 60, y: 80 }, { x: 85, y: 60 }, { x: 70, y: 30 }, { x: 40, y: 20 }, { x: 20, y: 40 }, { x: 15, y: 70 }, { x: 40, y: 90 }, { x: 75, y: 90 }, { x: 90, y: 75 }, { x: 95, y: 45 }, { x: 65, y: 15 }, { x: 30, y: 10 }, { x: 10, y: 30 }, { x: 45, y: 50 }],
                map_foret: [{ x: 20, y: 20 }, { x: 40, y: 40 }, { x: 25, y: 70 }, { x: 60, y: 75 }, { x: 80, y: 50 }, { x: 70, y: 25 }, { x: 90, y: 20 }, { x: 95, y: 45 }, { x: 90, y: 75 }, { x: 70, y: 95 }, { x: 40, y: 95 }, { x: 15, y: 85 }, { x: 10, y: 55 }, { x: 30, y: 25 }, { x: 50, y: 15 }, { x: 80, y: 10 }, { x: 55, y: 30 }],
                map_plage: [{ x: 50, y: 85 }, { x: 25, y: 65 }, { x: 35, y: 35 }, { x: 65, y: 30 }, { x: 80, y: 60 }, { x: 60, y: 75 }, { x: 80, y: 85 }, { x: 95, y: 65 }, { x: 90, y: 35 }, { x: 75, y: 15 }, { x: 45, y: 10 }, { x: 15, y: 25 }, { x: 10, y: 55 }, { x: 20, y: 80 }, { x: 40, y: 95 }, { x: 15, y: 45 }, { x: 60, y: 50 }]
            };
            const layout = MapLayouts[currentMap] || MapLayouts.map_general;
            const currentIdx = gameStateData.team?.currentStageIndex || 0;
            const point = layout[currentIdx % layout.length];

            const vW = mapViewportRef.current.clientWidth;
            // The map is 250% of the viewport. So mapWidth = 2.5 * vW.
            // Center of viewport = vW / 2
            // Node position inside map is (point.x / 100) * 2.5 * vW
            // shift needed: panX = vW / 2 - point.x/100 * 2.5 * vW
            const targetX = vW * (0.5 - 2.5 * point.x / 100);
            const targetY = vW * (0.5 - 2.5 * point.y / 100); // Because height = width for viewport

            setPan({ x: targetX, y: targetY });
        }
    }, [activeTab, gameStateData]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => { setIsDragging(false); };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    };

    const handleTouchEnd = () => { setIsDragging(false); };

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsChecking(true);
        const res = await fetch('/api/games/sarab-quest/player/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessCode })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('sarabSession', JSON.stringify(data.data));
            setTeamSession(data.data);
            fetchGameState(data.data.teamId);
        } else {
            setMessage({ text: data.error, type: 'error' });
        }
        setIsChecking(false);
    };

    const handleSubmitAnswer = async (e) => {
        e.preventDefault();

        let finalAnswer = answer;
        if (gameStateData?.stage?.validationType === 'choice') {
            if (selectedChoices.length === 0) {
                setMessage({ text: t('selectOneAnswer'), type: 'error' });
                return;
            }
            finalAnswer = selectedChoices.sort().join(',');
        } else if (!finalAnswer.trim()) {
            setMessage({ text: t('enterAnswer'), type: 'error' });
            return;
        }

        setMessage({ text: '', type: '' });
        setIsChecking(true);

        try {
            const res = await fetch('/api/games/sarab-quest/player/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: teamSession.teamId,
                    stageId: gameStateData.stage._id,
                    answer: finalAnswer
                })
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ text: data.message || t('successAccess'), type: 'success' });
                setAnswer('');
                setSelectedChoices([]);
                setGameStateData(prev => ({
                    ...prev,
                    team: { ...prev.team, score: prev.team.score + (gameStateData.stage.basePoints || 100) }
                }));
                setTimeout(() => {
                    setMessage({ text: '', type: '' });
                    fetchGameState(teamSession.teamId);
                }, 1500);
            } else {
                setMessage({ text: data.error || data.message || t('errorAccess'), type: 'error' });
            }
        } catch (error) {
            setMessage({ text: t('errorServer'), type: 'error' });
        } finally {
            setIsChecking(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sarabSession');
        setTeamSession(null);
        setGameState(null);
    };

    if (!teamSession) {
        return (
            <div className={styles.container} style={{ position: 'relative', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                <Link href="/games" style={{ position: 'absolute', top: '20px', left: language === 'ar' ? '20px' : 'auto', right: language === 'ar' ? 'auto' : '20px', color: '#a67c52', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, fontFamily: 'Rajdhani', fontWeight: 'bold' }}>
                    <ArrowRight size={24} style={{ transform: language === 'ar' ? 'rotate(180deg)' : 'none' }} />
                    <span style={{ fontSize: '1.2rem' }}>{t('back')}</span>
                </Link>

                <div className={styles.loginContainer}>
                    <div className={styles.loginCard}>
                        <h1 className={styles.loginTitle}>SARAB QUEST</h1>
                        <h2 className={styles.loginSubtitle}>{t('sarabQuestSubtitle')}</h2>

                        <form onSubmit={handleLogin}>
                            <input
                                type="text"
                                className={styles.codeInput}
                                placeholder={t('accessCode')}
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                disabled={isChecking}
                                style={{ direction: 'rtl', textAlign: 'center' }}
                            />

                            {message.text && (
                                <p className={`${styles.messageStatus} ${message.type === 'error' ? styles.messageError : styles.messageSuccess}`}>
                                    {message.text}
                                </p>
                            )}

                            <button type="submit" className={styles.joinBtn} disabled={isChecking}>
                                {isChecking ? t('syncingBtn') : t('startMissionBtn')}
                            </button>
                        </form>

                        {(currentUserRole === 'admin' || currentUserRole === 'director') && (
                            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(166, 124, 82, 0.3)' }}>
                                <Link href="/dashboard/games/sarab-quest" style={{textDecoration: 'none'}}>
                                    <button style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: '1px solid #a67c52',
                                        color: '#a67c52',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        fontFamily: 'Orbitron',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.background = 'rgba(166, 124, 82, 0.1)'; e.target.style.color = '#ff9900'; }}
                                    onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#a67c52'; }}
                                    >
                                        ⚙️ {t('adminDashboardBtn')}
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ color: '#00f0ff', fontFamily: 'Orbitron', fontSize: '1.5rem', animation: 'blink-caret 1s infinite' }}>{t('systemLoading')}</div>
        </div>
    }

    return (
        <div className={styles.container} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className={styles.contentWrapper}>
                {/* HUD Top */}
                <header className={styles.hud} style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
                    <div style={{ textAlign: language === 'ar' ? 'left' : 'right', zIndex: 3 }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Orbitron' }}>{t('totalScore')}</div>
                        <div className={styles.scoreValue}>{gameStateData?.team?.score || 0}</div>
                    </div>

                    <div style={{ textAlign: language === 'ar' ? 'right' : 'left', zIndex: 3 }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Orbitron' }}>{t('team')}</div>
                        <div className={styles.teamName}>
                            {teamSession.teamName}
                        </div>
                    </div>
                </header>

                <main className={styles.mainArea}>
                    {gameState === 'waiting' && (
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <AlertCircle size={60} color="#ff9900" style={{ margin: '0 auto 20px' }} />
                            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '2rem', color: '#ff9900', marginBottom: '15px' }}>{t('waitingMode')}</h2>
                            <p style={{ color: '#e2e8f0', marginBottom: '30px', fontSize: '1.2rem' }}>{t('waitingText')}</p>
                            <button onClick={() => fetchGameState(teamSession.teamId)} className={styles.submitBtn} style={{ padding: '15px 30px' }}>
                                {t('refreshConnection')}
                            </button>
                        </div>
                    )}

                    {gameState === 'completed' && (
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <Trophy size={80} color="#00e599" style={{ margin: '0 auto 20px' }} />
                            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '2.5rem', color: '#00e599', textShadow: '0 0 20px rgba(0,229,153,0.5)', marginBottom: '15px' }}>{t('missionCompleted')}</h2>
                            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{t('missionCompletedDesc')}</p>
                            <div style={{ background: 'rgba(0,240,255,0.1)', border: '2px solid #00f0ff', padding: '20px', borderRadius: '10px', display: 'inline-block', margin: '20px 0' }}>
                                <div style={{ fontSize: '1rem', color: '#00f0ff', textTransform: 'uppercase' }}>{t('finalScore')}</div>
                                <div style={{ fontSize: '3rem', fontFamily: 'Orbitron', color: '#fff', fontWeight: 'bold' }}>{gameStateData.team.score}</div>
                            </div>
                        </div>
                    )}

                    {gameState === 'playing' && gameStateData.stage && activeTab === 'clues' && (
                        <div className={styles.actionPanel}>
                            <div className={styles.clueCard}>
                                <div className={styles.clueTitleWrap}>
                                    <div className={styles.clueTitle}>{t('currentClue')}</div>
                                </div>
                                <div className={styles.clueCardInner}>
                                    <div className={`${styles.clueText} ${styles.typing}`}>
                                        {gameStateData.stage.clueText}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Action Panel based on validationType */}

                            {gameStateData.stage.validationType === 'choice' && (
                                <div className={styles.choiceGrid}>
                                    {gameStateData.stage.choices?.map((choice, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`${styles.choiceBtn} ${selectedChoices.includes(choice) ? styles.selected : ''}`}
                                            onClick={() => {
                                                if (selectedChoices.includes(choice)) {
                                                    setSelectedChoices(selectedChoices.filter(c => c !== choice));
                                                } else {
                                                    setSelectedChoices([...selectedChoices, choice]);
                                                }
                                            }}
                                            disabled={isChecking}
                                        >
                                            <span style={{ fontSize: '1.2rem', fontFamily: 'Orbitron', color: '#ffb74d' }}>{String.fromCharCode(65 + i)}</span>
                                            <span>{choice}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {gameStateData.stage.validationType === 'qr' && (
                                <button className={styles.scanBtn} onClick={() => alert(t('cameraUpdateAlert'))}>
                                    <ScanLine className={styles.scanIcon} /> {t('scanQrBtn')}
                                </button>
                            )}

                            {gameStateData.stage.validationType === 'nfc' && (
                                <div className={styles.nfcZone} onClick={() => alert(t('nfcSearchAlert'))}>
                                    <div className={styles.nfcWaves}></div>
                                    <Wifi size={50} color="#00e5ff" style={{ margin: '0 auto 10px' }} />
                                    <div style={{ fontFamily: 'Rajdhani', fontSize: '1.2rem', fontWeight: 'bold', color: '#00e5ff' }}>{t('nfcWave')}</div>
                                </div>
                            )}

                            {gameStateData.stage.validationType !== 'text' && gameStateData.stage.validationType !== 'choice' && (
                                <div className={styles.separator}>{t('orEnterManually')}</div>
                            )}

                            {(gameStateData.stage.validationType === 'text' || gameStateData.stage.validationType === 'qr' || gameStateData.stage.validationType === 'nfc' || gameStateData.stage.validationType === 'choice') && (
                                <form onSubmit={handleSubmitAnswer} className={styles.inputGroup} style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
                                    <button type="submit" className={styles.submitBtn} disabled={isChecking} style={{ 
                                        borderLeft: language === 'ar' ? 'none' : '2px solid #334354', 
                                        borderRight: language === 'ar' ? '2px solid #334354' : 'none' 
                                    }}>
                                        {t('confirmBtn')}
                                    </button>
                                    <input
                                        type="text"
                                        placeholder={gameStateData.stage.validationType === 'choice' ? t('inputChoicePlaceholder') : t('inputAnswerPlaceholder')}
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        disabled={isChecking}
                                        style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                                    />
                                </form>
                            )}

                            {message.text && (
                                <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold', letterSpacing: '1px' }} className={message.type === 'success' ? styles.messageSuccess : styles.messageError}>
                                    {message.text}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'leaderboard' && (gameState === 'playing' || gameState === 'completed') && (
                        <div className={styles.actionPanel} style={{ background: 'rgba(19, 25, 34, 0.8)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <Trophy size={40} color="#ff9900" style={{ margin: '0 auto 10px' }} />
                                <h3 style={{ fontFamily: 'Rajdhani', fontSize: '1.8rem', color: '#ff9900' }}>{t('liveRanking')}</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {gameStateData?.leaderboard?.map((team, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: team.teamName === teamSession.teamName ? 'linear-gradient(90deg, rgba(0, 229, 153, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%)' : 'rgba(0,0,0,0.4)',
                                        padding: '15px', borderRadius: '8px',
                                        border: team.teamName === teamSession.teamName ? '1px solid #00e599' : '1px solid rgba(166,124,82,0.2)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{
                                                fontSize: '1.5rem', fontFamily: 'Orbitron', fontWeight: 'bold',
                                                color: idx === 0 ? '#ff9900' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#b08d5b' : '#64748b',
                                                width: '30px', textAlign: 'center'
                                            }}>{idx + 1}</div>
                                            <div style={{ fontFamily: 'Rajdhani', fontSize: '1.2rem', color: team.teamName === teamSession.teamName ? '#00e599' : '#fff' }}>
                                                {team.teamName} {team.teamName === teamSession.teamName ? t('youLabel') : ''}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: language === 'ar' ? 'left' : 'right' }}>
                                            <div style={{ fontSize: '1.5rem', fontFamily: 'Orbitron', color: '#00f0ff', fontWeight: 'bold' }}>{team.score}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#a67c52' }}>{t('stageLabel')} {team.currentStageIndex}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'map' && (gameState === 'playing' || gameState === 'completed') && (
                        <div className={styles.complexMapWrapper} style={{ direction: 'ltr' }}>
                            <div
                                className={styles.mapCircleContainer}
                                ref={mapViewportRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                style={{
                                    border: '12px solid #5a3d2b',
                                    outline: '4px solid #1a110b',
                                    boxShadow: '0 0 30px rgba(90, 61, 43, 0.8), inset 0 0 40px rgba(0,0,0,0.8)',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: '100%',
                                    aspectRatio: '1',
                                    borderRadius: '50%'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0,
                                    width: '250%',
                                    height: '250%',
                                    backgroundImage: `url('/images/maps_photos/${gameStateData?.mapTexture || 'map_general'}.jfif')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                    willChange: 'transform'
                                }}>
                                    <div className={styles.mapBackgroundOverlay} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }}></div>

                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                        zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}>
                                        <MapPin size={40} color="#00e5ff" style={{ opacity: 0.1 }} />
                                    </div>

                                    {/* Dynamic Organic Path Tracing */}
                                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, overflow: 'visible', pointerEvents: 'none' }}>
                                        {gameStateData?.stagesSummary?.map((stage, idx) => {
                                            if (idx === 0) return null;
                                            const currentMap = gameStateData?.mapTexture || 'map_general';

                                            const MapLayouts = {
                                                map_general: [{ x: 65, y: 25 }, { x: 35, y: 35 }, { x: 48, y: 65 }, { x: 75, y: 75 }, { x: 50, y: 85 }, { x: 20, y: 70 }, { x: 15, y: 40 }, { x: 40, y: 20 }, { x: 80, y: 40 }, { x: 85, y: 65 }, { x: 65, y: 90 }, { x: 30, y: 90 }, { x: 10, y: 55 }, { x: 25, y: 20 }, { x: 55, y: 15 }, { x: 85, y: 25 }, { x: 90, y: 50 }],
                                                map_desert: [{ x: 80, y: 20 }, { x: 50, y: 40 }, { x: 30, y: 60 }, { x: 60, y: 80 }, { x: 85, y: 60 }, { x: 70, y: 30 }, { x: 40, y: 20 }, { x: 20, y: 40 }, { x: 15, y: 70 }, { x: 40, y: 90 }, { x: 75, y: 90 }, { x: 90, y: 75 }, { x: 95, y: 45 }, { x: 65, y: 15 }, { x: 30, y: 10 }, { x: 10, y: 30 }, { x: 45, y: 50 }],
                                                map_foret: [{ x: 20, y: 20 }, { x: 40, y: 40 }, { x: 25, y: 70 }, { x: 60, y: 75 }, { x: 80, y: 50 }, { x: 70, y: 25 }, { x: 90, y: 20 }, { x: 95, y: 45 }, { x: 90, y: 75 }, { x: 70, y: 95 }, { x: 40, y: 95 }, { x: 15, y: 85 }, { x: 10, y: 55 }, { x: 30, y: 25 }, { x: 50, y: 15 }, { x: 80, y: 10 }, { x: 55, y: 30 }],
                                                map_plage: [{ x: 50, y: 85 }, { x: 25, y: 65 }, { x: 35, y: 35 }, { x: 65, y: 30 }, { x: 80, y: 60 }, { x: 60, y: 75 }, { x: 80, y: 85 }, { x: 95, y: 65 }, { x: 90, y: 35 }, { x: 75, y: 15 }, { x: 45, y: 10 }, { x: 15, y: 25 }, { x: 10, y: 55 }, { x: 20, y: 80 }, { x: 40, y: 95 }, { x: 15, y: 45 }, { x: 60, y: 50 }]
                                            };

                                            const layout = MapLayouts[currentMap] || MapLayouts.map_general;

                                            // Auto-generate curvy path between start and end
                                            const start = layout[(idx - 1) % layout.length];
                                            const end = layout[idx % layout.length];

                                            // Generate a generic control point that forces the line straight for a moment then curves nicely
                                            const curvature = (idx % 2 === 0) ? 20 : -20;
                                            const cpX = (start.x + end.x) / 2 + curvature;
                                            const cpY = (start.y + end.y) / 2 + curvature;
                                            const pathData = `M ${start.x},${start.y} Q ${cpX},${cpY} ${end.x},${end.y}`;

                                            const currentIdx = gameStateData?.team?.currentStageIndex || 0;
                                            const isUnlocked = idx <= currentIdx;

                                            return (
                                                <g key={idx}>
                                                    {/* Base dim line for all connections (dirt road overlay) */}
                                                    <path
                                                        d={pathData}
                                                        fill="none"
                                                        stroke="rgba(0, 240, 255, 0.3)"
                                                        strokeWidth="0.3"
                                                        strokeDasharray="1 1"
                                                    />
                                                    {/* Glowing line for completed/active connections */}
                                                    {isUnlocked && (
                                                        <path
                                                            d={pathData}
                                                            fill="none"
                                                            stroke="#00f0ff"
                                                            strokeWidth="0.5"
                                                            strokeLinecap="round"
                                                            style={{ filter: 'drop-shadow(0 0 1.5px rgba(0,240,255,1))' }}
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {gameStateData?.stagesSummary?.map((stage, idx) => {
                                        const currentMap = gameStateData?.mapTexture || 'map_general';

                                        // Complete map points ensuring no collapse for games with large num stages
                                        const MapLayouts = {
                                            map_general: [{ x: 65, y: 25 }, { x: 35, y: 35 }, { x: 48, y: 65 }, { x: 75, y: 75 }, { x: 50, y: 85 }, { x: 20, y: 70 }, { x: 15, y: 40 }, { x: 40, y: 20 }, { x: 80, y: 40 }, { x: 85, y: 65 }, { x: 65, y: 90 }, { x: 30, y: 90 }, { x: 10, y: 55 }, { x: 25, y: 20 }, { x: 55, y: 15 }, { x: 85, y: 25 }, { x: 90, y: 50 }],
                                            map_desert: [{ x: 80, y: 20 }, { x: 50, y: 40 }, { x: 30, y: 60 }, { x: 60, y: 80 }, { x: 85, y: 60 }, { x: 70, y: 30 }, { x: 40, y: 20 }, { x: 20, y: 40 }, { x: 15, y: 70 }, { x: 40, y: 90 }, { x: 75, y: 90 }, { x: 90, y: 75 }, { x: 95, y: 45 }, { x: 65, y: 15 }, { x: 30, y: 10 }, { x: 10, y: 30 }, { x: 45, y: 50 }],
                                            map_foret: [{ x: 20, y: 20 }, { x: 40, y: 40 }, { x: 25, y: 70 }, { x: 60, y: 75 }, { x: 80, y: 50 }, { x: 70, y: 25 }, { x: 90, y: 20 }, { x: 95, y: 45 }, { x: 90, y: 75 }, { x: 70, y: 95 }, { x: 40, y: 95 }, { x: 15, y: 85 }, { x: 10, y: 55 }, { x: 30, y: 25 }, { x: 50, y: 15 }, { x: 80, y: 10 }, { x: 55, y: 30 }],
                                            map_plage: [{ x: 50, y: 85 }, { x: 25, y: 65 }, { x: 35, y: 35 }, { x: 65, y: 30 }, { x: 80, y: 60 }, { x: 60, y: 75 }, { x: 80, y: 85 }, { x: 95, y: 65 }, { x: 90, y: 35 }, { x: 75, y: 15 }, { x: 45, y: 10 }, { x: 15, y: 25 }, { x: 10, y: 55 }, { x: 20, y: 80 }, { x: 40, y: 95 }, { x: 15, y: 45 }, { x: 60, y: 50 }]
                                        };

                                        const layout = MapLayouts[currentMap] || MapLayouts.map_general;
                                        const point = layout[idx % layout.length];

                                        const currentIdx = gameStateData?.team?.currentStageIndex || 0;
                                        const isCompleted = idx < currentIdx;
                                        const isCurrent = idx === currentIdx && gameState !== 'completed';
                                        const isLocked = idx > currentIdx;

                                        const status = isCompleted ? 'completed' : isCurrent ? 'active' : 'locked';

                                        const left = `${point.x}%`;
                                        const top = `${point.y}%`;

                                        let IconComponent = FileText;
                                        if (stage.validationType === 'qr') IconComponent = ScanLine;
                                        if (stage.validationType === 'nfc') IconComponent = Wifi;
                                        if (stage.validationType === 'choice') IconComponent = Lightbulb;

                                        if (isLocked) IconComponent = Lock;

                                        return (
                                            <div key={idx} className={styles.mapNodeWrapper} style={{ left, top, zIndex: 10 }}>
                                                <div className={styles.mapNodeIcon} data-status={status}>
                                                    <IconComponent size={20} />
                                                </div>
                                                <div className={styles.mapNodeLabel} data-status={status}>
                                                    {stage.title}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className={styles.missionListPanel}>
                                <div className={styles.missionListTitle}>{t('missionListTitle')}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {gameStateData?.stagesSummary?.map((stage, idx) => {
                                        const currentIdx = gameStateData?.team?.currentStageIndex || 0;
                                        const isCompleted = idx < currentIdx;
                                        const isCurrent = idx === currentIdx && gameState !== 'completed';

                                        const status = isCompleted ? 'completed' : isCurrent ? 'active' : 'locked';

                                        let IconComponent = FileText;
                                        if (stage.validationType === 'qr') IconComponent = ScanLine;
                                        if (stage.validationType === 'nfc') IconComponent = Wifi;
                                        if (stage.validationType === 'choice') IconComponent = Lightbulb;
                                        if (status === 'locked') IconComponent = Lock;

                                        return (
                                            <div key={idx} className={styles.missionCard} data-status={status}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%', background: '#131922',
                                                    border: `1px solid ${isCompleted ? '#00e599' : isCurrent ? '#00f0ff' : '#a67c52'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: isCompleted ? '#00e599' : isCurrent ? '#00f0ff' : '#a67c52'
                                                }}>
                                                    <IconComponent size={18} />
                                                </div>
                                                <div style={{ flex: 1, textAlign: language === 'ar' ? 'right' : 'left' }}>
                                                    <div style={{ fontSize: '0.9rem', color: isCurrent ? '#00f0ff' : '#fff' }}>{stage.title}</div>
                                                    <div style={{ fontSize: '0.7rem', color: status === 'locked' ? '#a67c52' : status === 'active' ? '#00f0ff' : '#00e599', textTransform: 'capitalize', fontFamily: 'Orbitron' }}>
                                                        {t(`${status}Text`) || status}
                                                    </div>
                                                </div>
                                                {isCompleted && <CheckCircle2 size={16} color="#00e599" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Bottom Dock */}
                <nav className={styles.dock} style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
                    <button className={`${styles.dockItem} ${activeTab === 'map' ? styles.active : ''}`} onClick={() => setActiveTab('map')}>
                        <Map className={styles.dockIcon} />
                        <span className={styles.dockLabel}>{t('dockMap')}</span>
                    </button>
                    <button className={`${styles.dockItem} ${activeTab === 'clues' ? styles.active : ''}`} onClick={() => setActiveTab('clues')}>
                        <Lightbulb className={styles.dockIcon} />
                        <span className={styles.dockLabel}>{t('dockClues')}</span>
                    </button>
                    <button className={`${styles.dockItem} ${activeTab === 'leaderboard' ? styles.active : ''}`} onClick={() => setActiveTab('leaderboard')}>
                        <Trophy className={styles.dockIcon} />
                        <span className={styles.dockLabel}>{t('dockRanking')}</span>
                    </button>
                    <button className={styles.dockItem} onClick={handleLogout} style={{ opacity: 0.7 }}>
                        <LogOut className={styles.dockIcon} />
                        <span className={styles.dockLabel}>{t('dockLogout')}</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}
