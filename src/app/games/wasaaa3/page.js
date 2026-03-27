"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './wasaaa3.module.css';
import { Heart, Activity, MapPin, Zap, Trophy, User as UserIcon, Camera, LayoutGrid, X, RefreshCw, ChevronRight, Copy, Check, Users, Monitor, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Wasaaa3() {
    const router = useRouter();
    const canvasRef = useRef(null);
    const playerImgRef = useRef(null);
    const [user, setUser] = useState(null);
    const [gameState, setGameState] = useState('menu'); // 'menu', 'room-setup', 'room-lobby', 'playing', 'gameover', 'room-results', 'no-photo'
    const [mode, setMode] = useState('local'); // 'local', 'room'
    
    // UI states (synced with game loop)
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [hearts, setHearts] = useState(3);
    
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Online specific
    const [onlineRoom, setOnlineRoom] = useState(null);
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [wasaaa3Config, setWasaaa3Config] = useState(null);

    const gameRef = useRef({
        player: { x: 0, y: 0, width: 60, height: 60, lane: 1 },
        lanes: [0, 0, 0],
        obstacles: [],
        items: [],
        session: {
            score: 0,
            energy: 0,
            hearts: 3,
            startTime: 0
        },
        speed: 5,
        baseSpeed: 5,
        lastUpdate: 0,
        frame: 0
    });

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, scoresRes, settingsRes] = await Promise.all([
                    fetch('/api/auth/me'),
                    fetch('/api/games/wasaaa3/scores'),
                    fetch('/api/admin/settings')
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                    
                    // Initial check for photo
                    if (!userData.profileImage) {
                        setGameState('no-photo');
                    } else {
                        // Pre-load player image for canvas
                        const img = new window.Image();
                        img.onload = () => { playerImgRef.current = img; };
                        img.src = userData.profileImage;
                    }

                    // Check if game exists and access
                    if (settingsRes.ok) {
                        const settings = await settingsRes.json();
                        const config = settings?.games?.wasaaa3;
                        if (config) {
                            setWasaaa3Config(config);
                            
                            // Check Role/User Access
                            const hasRoleAccess = config.authorizedRoles?.includes(userData.role);
                            const hasUserAccess = config.authorizedUsers?.includes(userData._id || userData.userId);
                            const isPublished = config.isPublished;

                            if (!isPublished || (!hasRoleAccess && !hasUserAccess)) {
                                setGameState('forbidden');
                            }

                            // Apply default mode
                            if (config.modes === 'presence') {
                                setMode('local');
                            } else if (config.modes === 'online') {
                                setMode('room');
                            }
                        }
                    }
                } else {
                    router.push('/login');
                }

                if (scoresRes.ok) {
                    const scoresData = await scoresRes.json();
                    setLeaderboard(scoresData);
                }
            } catch (error) {
                console.error("Initialization error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // Polling for room state
    useEffect(() => {
        let interval;
        if (mode === 'room' && onlineRoom?._id && (gameState === 'room-lobby' || gameState === 'playing' || gameState === 'gameover')) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/games/wasaaa3/rooms/current?roomId=${onlineRoom._id}`);
                    const data = await res.json();
                    if (data.success) {
                        setOnlineRoom(data.data);
                        
                        // Auto-start if state changes to playing on server
                        if (data.data.status === 'playing' && gameState === 'room-lobby') {
                            startGame();
                        }
                        
                        // If room is finished, show results
                        if (data.data.status === 'finished') {
                            setGameState('room-results');
                        }
                        
                        // If current player finished, show results screen (even if others still playing)
                        if (mode === 'room' && gameState === 'gameover') {
                            setGameState('room-results');
                        }
                    }
                } catch (e) {
                    console.error("Polling error");
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [mode, onlineRoom?._id, gameState]);

    // Input Control
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameState !== 'playing') return;
            if (e.key === 'ArrowLeft' && gameRef.current.player.lane > 0) {
                gameRef.current.player.lane--;
            } else if (e.key === 'ArrowRight' && gameRef.current.player.lane < 2) {
                gameRef.current.player.lane++;
            }
        };

        const handleTouch = (e) => {
            if (gameState !== 'playing') return;
            // Prevent scrolling/zoom while playing
            if (e.cancelable) e.preventDefault();
            
            const touchX = e.touches[0].clientX;
            const screenWidth = window.innerWidth;
            
            if (touchX < screenWidth / 2) {
                if (gameRef.current.player.lane > 0) gameRef.current.player.lane--;
            } else {
                if (gameRef.current.player.lane < 2) gameRef.current.player.lane++;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('touchstart', handleTouch, { passive: false });
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('touchstart', handleTouch);
        };
    }, [gameState]);

    // Game Core
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationId;

        // Reset game session data
        gameRef.current = {
            ...gameRef.current,
            player: { ...gameRef.current.player, lane: 1 },
            lanes: [canvas.width / 4, canvas.width / 2, (canvas.width / 4) * 3],
            obstacles: [],
            items: [],
            session: {
                score: 0,
                energy: 0,
                hearts: 3,
                startTime: Date.now()
            },
            speed: 5,
            baseSpeed: 5,
            lastUpdate: Date.now(),
            frame: 0
        };

        const update = () => {
            const now = Date.now();
            gameRef.current.lastUpdate = now;
            gameRef.current.frame++;

            // Acceleration Logic
            const elapsed = (now - gameRef.current.session.startTime) / 1000;
            gameRef.current.speed = gameRef.current.baseSpeed + (elapsed * 0.1);

            // Smooth Interpolation for Player position
            const targetX = gameRef.current.lanes[gameRef.current.player.lane];
            gameRef.current.player.x += (targetX - gameRef.current.player.x) * 0.2;
            gameRef.current.player.y = canvas.height - 150;

            // Spawner
            if (gameRef.current.frame % 45 === 0) {
                const lane = Math.floor(Math.random() * 3);
                if (Math.random() > 0.3) {
                    gameRef.current.obstacles.push({ x: gameRef.current.lanes[lane], y: -50 });
                } else {
                    gameRef.current.items.push({ x: gameRef.current.lanes[lane], y: -50, color: '#fbbf24' });
                }
            }

            // Movement
            gameRef.current.obstacles.forEach(o => o.y += gameRef.current.speed);
            gameRef.current.items.forEach(i => i.y += gameRef.current.speed);

            // Collisions
            gameRef.current.obstacles = gameRef.current.obstacles.filter(o => {
                const collides = Math.abs(o.x - gameRef.current.player.x) < 50 && Math.abs(o.y - gameRef.current.player.y) < 50;
                if (collides) {
                    gameRef.current.session.hearts--;
                    setHearts(gameRef.current.session.hearts);
                    
                    if (gameRef.current.session.hearts <= 0) {
                        setGameState('gameover');
                        saveScore();
                        return false;
                    }
                    return false;
                }
                return o.y < canvas.height;
            });

            gameRef.current.items = gameRef.current.items.filter(i => {
                const collides = Math.abs(i.x - gameRef.current.player.x) < 50 && Math.abs(i.y - gameRef.current.player.y) < 50;
                if (collides) {
                    gameRef.current.session.energy++;
                    setEnergy(gameRef.current.session.energy);
                    return false;
                }
                return i.y < canvas.height;
            });

            const currentScore = Math.floor(elapsed * 10);
            gameRef.current.session.score = currentScore;
            setScore(currentScore);

            // PAINTING
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Road Lines
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.setLineDash([30, 30]);
            gameRef.current.lanes.forEach(x => {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            });
            ctx.setLineDash([]);

            // Obstacles
            ctx.fillStyle = '#ef4444';
            gameRef.current.obstacles.forEach(o => {
                ctx.beginPath();
                ctx.roundRect(o.x - 30, o.y - 30, 60, 60, 10);
                ctx.fill();
            });

            // Energy
            ctx.fillStyle = '#fbbf24';
            gameRef.current.items.forEach(i => {
                ctx.beginPath();
                ctx.arc(i.x, i.y, 15, 0, Math.PI * 2);
                ctx.fill();
            });

            // PLAYER - Drawing the photo inside a circle
            const p = gameRef.current.player;
            ctx.save();
            ctx.translate(p.x, p.y);
            
            // Outer glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#10b981';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Clip the circle
            ctx.beginPath();
            ctx.arc(0, 0, 38, 0, Math.PI * 2);
            ctx.clip();
            
            if (playerImgRef.current) {
                ctx.drawImage(playerImgRef.current, -38, -38, 76, 76);
            } else {
                ctx.fillStyle = '#475569';
                ctx.fillRect(-38, -38, 76, 76);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(user?.firstName?.[0] || '?', 0, 10);
            }
            
            ctx.restore();

            if (gameState === 'playing') {
                animationId = requestAnimationFrame(update);
            }
        };

        const resize = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            gameRef.current.lanes = [canvas.width / 4, canvas.width / 2, (canvas.width / 4) * 3];
        };

        window.addEventListener('resize', resize);
        resize();
        animationId = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, [gameState]);

    const saveScore = async () => {
        try {
            const { score: finalScore, energy: finalEnergy, hearts: finalHearts } = gameRef.current.session;
            const calculatedScore = Math.floor((Date.now() - gameRef.current.session.startTime) / 100);

            if (mode === 'room' && onlineRoom) {
                // Save to Room specific API
                await fetch('/api/games/wasaaa3/rooms/finish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        roomId: onlineRoom._id,
                        score: calculatedScore,
                        energy: finalEnergy,
                        finalHearts: finalHearts
                    })
                });
            } else {
                // Save to Global Leaderboard only if not in Room mode
                await fetch('/api/games/wasaaa3/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        score: calculatedScore, 
                        energy: finalEnergy, 
                        distance: finalScore 
                    })
                });
                const refresh = await fetch('/api/games/wasaaa3/scores');
                if (refresh.ok) setLeaderboard(await refresh.json());
            }
        } catch (e) {
            console.error("Score persist fail");
        }
    };

    const startGame = () => {
        setScore(0);
        setEnergy(0);
        setHearts(3);
        setGameState('playing');
    };

    const createRoom = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/games/wasaaa3/rooms/create', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setOnlineRoom(data.data);
                setGameState('room-lobby');
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Erreur création room");
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = async () => {
        if (!roomCodeInput) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/games/wasaaa3/rooms/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode: roomCodeInput })
            });
            const data = await res.json();
            if (data.success) {
                setOnlineRoom(data.data);
                setGameState('room-lobby');
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Erreur joining room");
        } finally {
            setLoading(false);
        }
    };

    const toggleReady = async () => {
        if (!onlineRoom) return;
        const newReady = !isReady;
        setIsReady(newReady);
        try {
            const res = await fetch('/api/games/wasaaa3/rooms/ready', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: onlineRoom._id, ready: newReady })
            });
            const data = await res.json();
            if (data.success) {
                setOnlineRoom(data.data);
            }
        } catch (e) {
            console.error("Error setting ready");
        }
    };

    const copyRoomCode = () => {
        if (onlineRoom?.roomCode) {
            navigator.clipboard.writeText(onlineRoom.roomCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    if (loading && gameState === 'menu') return <div className={styles.gameContainer} style={{display:'flex', alignItems:'center', justifyContent:'center'}}>Chargement du moteur...</div>;

    const renderMenu = () => (
        <div className={styles.overlay}>
            <div className={styles.menu} style={{maxHeight:'90vh', overflowY:'auto', paddingTop:'20px'}}>
                <div className={styles.avatarContainer}>
                    {user?.profileImage ? (
                        <Image src={user.profileImage} alt="" width={120} height={120} style={{objectFit:'cover'}}/>
                    ) : (
                        <div style={{width:'100%', height:'100%', background:'#475569', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <UserIcon size={64}/>
                        </div>
                    )}
                </div>

                <h1 className="text-5xl font-black mb-2">WASAAA3 ⚡</h1>
                <p className="text-gray-400 mb-8">Foncez <span className="text-emerald-400">{user?.firstName}</span> !</p>

                <div className={styles.modeSelection}>
                    {(!wasaaa3Config || wasaaa3Config.modes === 'presence' || wasaaa3Config.modes === 'both') && (
                        <button className={`${styles.modeBtn} ${mode === 'local' ? styles.modeBtnActive : ''}`} onClick={() => setMode('local')}>
                            <Users size={32} />
                            <span className="text-xs font-bold">PRÉSENTIEL</span>
                        </button>
                    )}
                    {(!wasaaa3Config || wasaaa3Config.modes === 'online' || wasaaa3Config.modes === 'both') && (
                        <button className={`${styles.modeBtn} ${mode === 'room' ? styles.modeBtnActive : ''}`} onClick={() => setMode('room')}>
                            <Monitor size={32} />
                            <span className="text-xs font-bold">EN LIGNE</span>
                        </button>
                    )}
                </div>

                {mode === 'local' ? (
                    <button onClick={startGame} className={styles.startBtn}>DÉMARRER LA COURSE</button>
                ) : (
                    <button onClick={() => setGameState('room-setup')} className={styles.startBtn}>MULTIJOUEUR ATA</button>
                )}
                
                <div style={{marginTop:'15px'}}><Link href="/games" className="text-gray-500 hover:text-white transition-colors">Retour au hub</Link></div>

                {leaderboard.length > 0 && mode === 'local' && (
                    <div className={styles.leaderboard} style={{marginTop:'40px', width:'100%'}}>
                        <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                            <Trophy size={18} /> TOP 10 DES COUREURS
                        </h3>
                        {leaderboard.map((entry, idx) => (
                            <div key={entry._id} className={styles.leaderboardItem}>
                                <div className={styles.rank}>{idx + 1}</div>
                                <div style={{width:'40px', height:'40px', borderRadius:'50%', overflow:'hidden', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    {entry.user?.profileImage ? (
                                        <img src={entry.user.profileImage} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                                    ) : <UserIcon size={20} className="opacity-20"/>}
                                </div>
                                <div className={styles.playerName}>
                                    <div className="font-bold">{entry.user?.firstName} {entry.user?.lastName}</div>
                                    <div className="text-[10px] opacity-40 uppercase">Record Perso</div>
                                </div>
                                <div className="text-right">
                                    <div className={styles.playerScore}>{entry.score}</div>
                                    <div className="text-[10px] text-amber-500 font-bold">⚡ {entry.energy}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderRoomSetup = () => (
        <div className={styles.overlay}>
            <div className={styles.menu}>
                <button className="flex items-center gap-2 text-gray-400 mb-8 hover:text-white transition-colors" onClick={() => setGameState('menu')}>
                    <ArrowLeft size={16}/> Retour
                </button>
                <h1 className="text-3xl font-black mb-8 uppercase">Configuration Salle</h1>
                
                {error && <div className="mb-4 text-red-500 font-bold">{error}</div>}

                <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10">
                    <h3 className="text-sm font-bold opacity-50 mb-4 uppercase tracking-wider text-left">Rejoindre</h3>
                    <input 
                        className={styles.input} 
                        placeholder="CODE DE LA SALLE" 
                        value={roomCodeInput} 
                        onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                        maxLength={6}
                    />
                    <button className={styles.startBtn} style={{width:'100%'}} onClick={joinRoom} disabled={!roomCodeInput || loading}>REJOINDRE</button>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <h3 className="text-sm font-bold opacity-50 mb-4 uppercase tracking-wider text-left">Nouvelle Salle</h3>
                    <button className={styles.startBtn} style={{width:'100%', background:'#3b82f6'}} onClick={createRoom} disabled={loading}>CRÉER UNE SALLE</button>
                </div>
            </div>
        </div>
    );

    const renderRoomLobby = () => (
        <div className={styles.overlay}>
            <div className={styles.menu}>
                <h1 className="text-2xl font-black mb-8 uppercase text-emerald-400">Salle d'attente</h1>
                
                <div className={styles.roomBadge}>
                    <span>CODE:</span>
                    <span className={styles.roomCodeDisplay}>{onlineRoom?.roomCode}</span>
                    <button className={styles.copyBtn} onClick={copyRoomCode}>
                        {copiedCode ? <Check size={18} color="#10b981"/> : <Copy size={18}/>}
                    </button>
                </div>

                <p className="text-xs opacity-50 mb-6">Partagez ce code avec vos amis pour qu'ils rejoignent la course.</p>

                <div className={styles.playerList}>
                    {onlineRoom?.players.map(p => (
                        <div key={p.userId} className={styles.playerItem}>
                            <div className="flex items-center gap-3">
                                <div style={{width:32, height:32, borderRadius:'50%', overflow:'hidden', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
                                    {p.profileImage ? (
                                        <Image src={p.profileImage} alt="" fill style={{objectFit:'cover'}} unoptimized/>
                                    ) : <UserIcon size={16} className="opacity-20"/>}
                                </div>
                                <span className="font-bold">{p.name} {String(p.userId) === String(user?.userId || user?._id) ? "(Moi)" : ""}</span>
                            </div>
                            <div className={`${styles.readyBadge} ${p.ready ? styles.readyTrue : styles.readyFalse}`}>
                                {p.ready ? "Prêt" : "Pas Prêt"}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-col gap-4">
                    <button className={styles.startBtn} onClick={toggleReady}>
                        {isReady ? "ATTENDRE..." : "JE SUIS PRÊT !"}
                    </button>
                    <button className="text-gray-500 text-sm" onClick={() => { setGameState('menu'); setOnlineRoom(null); }}>Quitter la salle</button>
                </div>
            </div>
        </div>
    );

    const renderGameOver = () => (
        <div className={styles.overlay}>
            <div className={styles.menu}>
                <h1 className="text-5xl font-black mb-2">COURSE TERMINÉE !</h1>
                <p className="text-gray-400 mb-8">Performance exceptionnelle <span className="text-emerald-400">{user?.firstName}</span> !</p>
                
                <div className="mb-8 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                    <div className="grid grid-cols-2 gap-4">
                        <div><div className="text-xs opacity-50">SCORE</div><div className="text-2xl font-black">{score}</div></div>
                        <div><div className="text-xs opacity-50">ÉNERGIE</div><div className="text-2xl font-black text-amber-400">{energy}</div></div>
                    </div>
                </div>

                {mode === 'local' ? (
                    <>
                        <button onClick={startGame} className={styles.startBtn}>RECOMMENCER</button>
                        <div style={{marginTop:'15px'}}><button onClick={() => setGameState('menu')} className="text-gray-500 hover:text-white transition-colors">Menu principal</button></div>
                    </>
                ) : (
                    <div className="text-amber-400 font-bold animate-pulse">
                        En attente des autres joueurs pour afficher le classement...
                    </div>
                )}
            </div>
        </div>
    );

    const renderRoomResults = () => {
        // Sort players by score
        const sortedPlayers = [...(onlineRoom?.players || [])].sort((a, b) => b.score - a.score);

        return (
            <div className={styles.overlay}>
                <div className={styles.menu} style={{maxHeight:'90vh', overflowY:'auto', paddingTop:'20px'}}>
                     <h1 className="text-3xl font-black mb-2 uppercase italic">Résultats de la Salle</h1>
                     
                     <div className={styles.roomBadge} style={{width:'fit-content', margin:'0 auto 30px'}}>
                        <span>CODE:</span>
                        <span className={styles.roomCodeDisplay} style={{fontSize:'1rem'}}>{onlineRoom?.roomCode}</span>
                        <button className={styles.copyBtn} onClick={copyRoomCode}>
                            {copiedCode ? <Check size={14} color="#10b981"/> : <Copy size={14}/>}
                        </button>
                    </div>

                    <div className={styles.leaderboard} style={{marginTop:0, width:'100%'}}>
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                            <Trophy size={14} /> CLASSEMENT DE LA SESSION
                        </h3>
                        <div className="space-y-3">
                            {sortedPlayers.map((p, idx) => (
                                <div key={p.userId} className={styles.leaderboardItem} style={{
                                    background: idx === 0 ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                                    borderRadius: '12px',
                                    padding: '8px 12px',
                                    opacity: p.isFinished ? 1 : 0.5
                                }}>
                                    <div className={styles.rank}>{idx + 1}</div>
                                    <div style={{width:'40px', height:'40px', borderRadius:'50%', overflow:'hidden', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
                                        {p.profileImage ? (
                                            <Image src={p.profileImage} alt="" fill style={{objectFit:'cover'}} unoptimized/>
                                        ) : <UserIcon size={20} className="opacity-20"/>}
                                    </div>
                                    <div className={styles.playerName}>
                                        <div className="font-bold">{p.name} {String(p.userId) === String(user?.userId || user?._id) ? "(Moi)" : ""}</div>
                                        <div className="text-[10px] opacity-40 uppercase">{p.isFinished ? "Course Terminée" : "En cours..."}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={styles.playerScore}>{p.score}</div>
                                        <div className="text-[10px] text-amber-500 font-bold">⚡ {p.energy || 0}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-4">
                        <button className={styles.startBtn} onClick={() => { setGameState('room-lobby'); setIsReady(false); }}>REJOUER</button>
                        <button className="text-gray-500 text-sm" onClick={() => { setGameState('menu'); setOnlineRoom(null); setMode('local'); }}>Menu Principal</button>
                    </div>
                </div>
            </div>
        );
    };

    if (gameState === 'no-photo') return (
        <div className={styles.gameContainer}>
            <div className={styles.overlay}>
                <div className={styles.menu}>
                    <h1 className="text-3xl font-black mb-4">PHOTO REQUISE ! 📸</h1>
                    <p className="text-gray-400 mb-8">Ajoutez votre plus belle photo à votre profil pour pouvoir courir sur Wasaaa3.</p>
                    <Link href="/dashboard/profile" className={styles.startBtn} style={{background:'#ef4444'}}>PROFIL MEMBRE</Link>
                </div>
            </div>
        </div>
    );

    if (gameState === 'forbidden') return (
        <div className={styles.gameContainer}>
            <div className={styles.overlay}>
                <div className={styles.menu}>
                    <X size={64} className="text-red-500 mb-6" />
                    <h1 className="text-2xl font-black mb-4 uppercase">Accès restreint</h1>
                    <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                        Désolé, l'accès au jeu WASAA3 est actuellement restreint par l'administration ou pour votre rôle.
                    </p>
                    <Link href="/dashboard" className={styles.startBtn} style={{background:'#475569', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>RETOUR AU DASHBOARD</Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.gameContainer}>
            {/* Playing HUD */}
            {gameState === 'playing' && (
                <div className={styles.hud}>
                    <div className={styles.stats}>
                        <div className={styles.statItem}><div className={styles.statLabel}>Score</div><div className={styles.statValue}>{score}</div></div>
                        <div className={styles.statItem}><div className={styles.statLabel}>Énergie</div><div className={styles.statValue} style={{color:'#fbbf24'}}>{energy}</div></div>
                    </div>
                    <div className={styles.hearts}>
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} className={styles.heart} fill={i < hearts ? "#ef4444" : "rgba(255,255,255,0.1)"} stroke={i < hearts ? "#ef4444" : "rgba(255,255,255,0.3)"}/>
                        ))}
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className={styles.canvas} />

            {gameState === 'menu' && renderMenu()}
            {gameState === 'room-setup' && renderRoomSetup()}
            {gameState === 'room-lobby' && renderRoomLobby()}
            {gameState === 'gameover' && renderGameOver()}
            {gameState === 'room-results' && renderRoomResults()}
        </div>
    );
}
