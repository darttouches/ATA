"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './wasaaa3.module.css';
import { Heart, Activity, MapPin, Zap, Trophy, User as UserIcon, Camera, LayoutGrid, X, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Wasaaa3() {
    const router = useRouter();
    const canvasRef = useRef(null);
    const playerImgRef = useRef(null);
    const [user, setUser] = useState(null);
    const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover', 'no-photo'
    
    // UI states (synced with game loop)
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [hearts, setHearts] = useState(3);
    
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

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
                const [userRes, scoresRes] = await Promise.all([
                    fetch('/api/auth/me'),
                    fetch('/api/games/wasaaa3/scores')
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                    if (!userData.profileImage) {
                        setGameState('no-photo');
                    } else {
                        // Pre-load player image for canvas
                        const img = new window.Image();
                        img.onload = () => { playerImgRef.current = img; };
                        img.src = userData.profileImage;
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

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    // Game Core
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
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
            // Use values from the current ref session to avoid stale state issues in callback
            const { score: finalScore, energy: finalEnergy } = gameRef.current.session;
            
            // Wait a tiny bit to make sure UI states caught up if needed for visual match
            await fetch('/api/games/wasaaa3/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    score: Math.floor((Date.now() - gameRef.current.session.startTime) / 100), 
                    energy: finalEnergy, 
                    distance: finalScore 
                })
            });
            const refresh = await fetch('/api/games/wasaaa3/scores');
            if (refresh.ok) setLeaderboard(await refresh.json());
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

    if (loading) return <div className={styles.gameContainer} style={{display:'flex', alignItems:'center', justifyContent:'center'}}>Chargement du moteur...</div>;

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

            {/* Menu & Results & Leaderboard Overlay */}
            {gameState !== 'playing' && (
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

                        {gameState === 'no-photo' ? (
                            <div>
                                <h1 className="text-3xl font-black mb-4">PHOTO REQUISE ! 📸</h1>
                                <p className="text-gray-400 mb-8">Ajoutez votre plus belle photo à votre profil pour pouvoir courir sur Wasaaa3.</p>
                                <Link href="/dashboard/profile" className={styles.startBtn} style={{background:'#ef4444'}}>PROFIL MEMBRE</Link>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-5xl font-black mb-2">WASAAA3 ⚡</h1>
                                <p className="text-gray-400 mb-8">Foncez <span className="text-emerald-400">{user?.firstName}</span> !</p>
                                
                                {gameState === 'gameover' && (
                                    <div className="mb-8 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><div className="text-xs opacity-50">SCORE</div><div className="text-2xl font-black">{score}</div></div>
                                            <div><div className="text-xs opacity-50">ÉNERGIE</div><div className="text-2xl font-black text-amber-400">{energy}</div></div>
                                        </div>
                                    </div>
                                )}

                                <button onClick={startGame} className={styles.startBtn}>
                                    {gameState === 'gameover' ? 'REPRENDRE LA COURSE' : 'DÉMARRER'}
                                </button>
                                
                                <div style={{marginTop:'15px'}}><Link href="/games" className="text-gray-500 hover:text-white transition-colors">Retour au hub</Link></div>
                            </div>
                        )}

                        {leaderboard.length > 0 && (
                            <div className={styles.leaderboard} style={{marginTop:'40px', width:'100%'}}>
                                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                                    <Trophy size={18} /> TOP 10 DES COUREURS
                                </h3>
                                <div className="space-y-3">
                                    {leaderboard.map((entry, idx) => (
                                        <div key={entry._id} className={styles.leaderboardItem} style={{
                                            background: idx === 0 ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                                            borderRadius: '12px',
                                            padding: '8px 12px'
                                        }}>
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
                            </div>
                        )}
                        
                        <div style={{height:'30px'}}></div>
                    </div>
                </div>
            )}
        </div>
    );
}
