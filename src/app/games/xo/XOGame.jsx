"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './xo.module.css';
import { Users, Monitor, RotateCcw, Trophy, Smile, Frown, Angry, ArrowLeft, Send, Hash, Play, Info, Copy, Check } from 'lucide-react';
import Link from 'next/link';

const INITIAL_BOARD = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];

const INITIAL_PIECES = 4;

export default function XOGame({ user }) {
    const [gameState, setGameState] = useState("mode-selection"); 
    const [mode, setMode] = useState(null); 
    const [board, setBoard] = useState(INITIAL_BOARD);
    const [players, setPlayers] = useState({
        X: { name: 'Joueur 1', reserve: INITIAL_PIECES },
        O: { name: 'Joueur 2', reserve: INITIAL_PIECES }
    });
    const [currentPlayer, setCurrentPlayer] = useState('X');
    const [phase, setPhase] = useState('placement'); 
    const [selectedCell, setSelectedCell] = useState(null); 
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState([]);
    const [activeEmoji, setActiveEmoji] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [xoConfig, setXoConfig] = useState(null);
    
    // Online specific
    const [room, setRoom] = useState(null);
    const [roomCode, setRoomCode] = useState('');
    const [mySymbol, setMySymbol] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('xo_mySymbol');
        }
        return null;
    });
    const lastReactionId = useRef(null);

    useEffect(() => {
        if (mySymbol) {
            localStorage.setItem('xo_mySymbol', mySymbol);
        }
    }, [mySymbol]);

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.games?.xo) {
                    setXoConfig(data.games.xo);
                    if (data.games.xo.modes === 'presence') {
                        setMode('presence');
                        setGameState('setup-presence');
                    } else if (data.games.xo.modes === 'online') {
                        setMode('online');
                        setGameState('setup-online');
                    }
                }
            });
    }, []);

    // --- Win Check ---

    const getWinningLine = (currentBoard) => {
        // Rows
        for (let r = 0; r < 4; r++) {
            if (currentBoard[r][0] && currentBoard[r][0] === currentBoard[r][1] && currentBoard[r][1] === currentBoard[r][2] && currentBoard[r][2] === currentBoard[r][3]) {
                return { symbol: currentBoard[r][0], line: [[r,0], [r,1], [r,2], [r,3]] };
            }
        }
        // Cols
        for (let c = 0; c < 4; c++) {
            if (currentBoard[0][c] && currentBoard[0][c] === currentBoard[1][c] && currentBoard[1][c] === currentBoard[2][c] && currentBoard[2][c] === currentBoard[3][c]) {
                return { symbol: currentBoard[0][c], line: [[0,c], [1,c], [2,c], [3,c]] };
            }
        }
        // Diagonals
        if (currentBoard[0][0] && currentBoard[0][0] === currentBoard[1][1] && currentBoard[1][1] === currentBoard[2][2] && currentBoard[2][2] === currentBoard[3][3]) {
            return { symbol: currentBoard[0][0], line: [[0,0], [1,1], [2,2], [3,3]] };
        }
        if (currentBoard[0][3] && currentBoard[0][3] === currentBoard[1][2] && currentBoard[1][2] === currentBoard[2][1] && currentBoard[2][1] === currentBoard[3][0]) {
            return { symbol: currentBoard[0][3], line: [[0,3], [1,2], [2,1], [3,0]] };
        }
        return null;
    };

    // --- Handlers ---

    const handleCellClick = async (r, c) => {
        if (winner || loading) return;
        
        if (mode === 'online') {
            if (room.currentTurn !== mySymbol) return;
            handleOnlineAction(r, c);
            return;
        }

        setError(null);
        let occupant = board[r][c];

        if (phase === 'placement') {
            if (occupant === null) {
                const nextBoard = board.map(row => [...row]);
                nextBoard[r][c] = currentPlayer;
                const nextPlayers = { ...players };
                nextPlayers[currentPlayer].reserve -= 1;
                
                setBoard(nextBoard);
                setPlayers(nextPlayers);

                const win = getWinningLine(nextBoard);
                if (win) {
                    setWinner(win.symbol);
                    setWinningLine(win.line);
                    setGameState("finished");
                } else {
                    const nextP = currentPlayer === 'X' ? 'O' : 'X';
                    setCurrentPlayer(nextP);
                    if (nextPlayers.X.reserve === 0 && nextPlayers.O.reserve === 0) {
                        setPhase('movement');
                    }
                }
            } else if (occupant !== currentPlayer) {
                ejectPiece(r, c);
            }
        } else {
            // Phase Movement
            if (selectedCell) {
                if (r === selectedCell.r && c === selectedCell.c) {
                    setSelectedCell(null);
                } else if (occupant === null) {
                    const nextBoard = board.map(row => [...row]);
                    nextBoard[r][c] = currentPlayer;
                    nextBoard[selectedCell.r][selectedCell.c] = null;
                    const win = getWinningLine(nextBoard);
                    setBoard(nextBoard);
                    setSelectedCell(null);
                    if (win) {
                        setWinner(win.symbol);
                        setWinningLine(win.line);
                        setGameState("finished");
                    } else {
                        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
                    }
                } else if (occupant !== currentPlayer) {
                    ejectPiece(r, c);
                } else {
                    setSelectedCell({ r, c });
                }
            } else {
                if (occupant === currentPlayer) {
                    setSelectedCell({ r, c });
                } else if (occupant !== null && occupant !== currentPlayer) {
                    ejectPiece(r, c);
                } else if (occupant === null && players[currentPlayer].reserve > 0) {
                    // Re-place from reserve
                    const nextBoard = board.map(row => [...row]);
                    nextBoard[r][c] = currentPlayer;
                    const nextPlayers = { ...players };
                    nextPlayers[currentPlayer].reserve -= 1;
                    setBoard(nextBoard);
                    setPlayers(nextPlayers);
                    const win = getWinningLine(nextBoard);
                    if (win) {
                        setWinner(win.symbol);
                        setWinningLine(win.line);
                        setGameState("finished");
                    } else {
                        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
                    }
                }
            }
        }
    };

    const ejectPiece = (r, c) => {
        const occupantSymbol = board[r][c];
        const nextBoard = board.map(row => [...row]);
        nextBoard[r][c] = null;
        const nextPlayers = { ...players };
        nextPlayers[occupantSymbol].reserve += 1;
        setBoard(nextBoard);
        setPlayers(nextPlayers);
        setSelectedCell(null);
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    };

    // --- Online Actions ---

    const handleOnlineAction = async (r, c) => {
        setError(null);
        let actionParams = {};
        
        let occupant = board[r][c];

        if (phase === 'placement') {
            if (occupant === null) {
                actionParams = { action: 'place', r, c };
            } else if (occupant !== mySymbol) {
                actionParams = { action: 'eject', r, c };
            }
        } else {
            if (selectedCell) {
                if (occupant === null) {
                    actionParams = { action: 'move', from: selectedCell, to: { r, c } };
                    setSelectedCell(null);
                } else if (occupant !== mySymbol) {
                    actionParams = { action: 'eject', r, c };
                    setSelectedCell(null);
                } else {
                    setSelectedCell({ r, c });
                    return;
                }
            } else {
                if (occupant === mySymbol) {
                    setSelectedCell({ r, c });
                    return;
                } else if (occupant !== null && occupant !== mySymbol) {
                    actionParams = { action: 'eject', r, c };
                } else if (occupant === null && players[mySymbol].reserve > 0) {
                    actionParams = { action: 'place', r, c };
                } else {
                    return;
                }
            }
        }

        if (!actionParams.action) return;

        try {
            const res = await fetch('/api/games/xo/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: room._id, ...actionParams })
            });
            const data = await res.json();
            if (data.success) {
                setRoom(data.data);
                syncRoom(data.data);
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Erreur de communication avec le serveur.");
        }
    };

    const createOnlineRoom = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/games/xo/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: players.X.name })
            });
            const data = await res.json();
            if (data.success) {
                setRoom(data.data);
                setMySymbol(data.data.players[0].symbol);
                setGameState("playing");
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Erreur creation.");
        } finally {
            setLoading(false);
        }
    };

    const joinOnlineRoom = async () => {
        if (!roomCode) return;
        setLoading(true);
        try {
            const res = await fetch('/api/games/xo/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode: roomCode.toUpperCase(), name: players.O.name })
            });
            const data = await res.json();
            if (data.success) {
                setRoom(data.data);
                setMySymbol(data.data.players[1].symbol);
                setGameState("playing");
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Erreur join.");
        } finally {
            setLoading(false);
        }
    };

    const syncRoom = (data) => {
        setRoom(data);
        setBoard(data.board);
        setCurrentPlayer(data.currentTurn);
        const pX = data.players.find(p => p.symbol === 'X');
        const pO = data.players.find(p => p.symbol === 'O');
        setPlayers({
            X: { name: pX?.name || '?', reserve: pX?.reserveCount || 0 },
            O: { name: pO?.name || '?', reserve: pO?.reserveCount || 0 }
        });
        
        // Auto-switch to playing if room started
        if (data.status === 'playing' && gameState !== 'playing') {
            setGameState('playing');
        }

        if (pX?.reserveCount === 0 && pO?.reserveCount === 0) {
            setPhase('movement');
        } else {
            setPhase('placement');
        }
        if (data.status === 'finished') {
            setWinner(data.winner);
            const win = getWinningLine(data.board);
            if (win) setWinningLine(win.line);
        }

        // Reactions
        const lastReaction = data.reactions?.[data.reactions.length - 1];
        if (lastReaction && lastReaction.timestamp !== lastReactionId.current) {
            console.log("[Sync] Reaction received:", lastReaction.type);
            lastReactionId.current = lastReaction.timestamp;
            const rUserId = String(lastReaction.userId);
            const reactionPlayer = data.players.find(p => String(p.userId) === rUserId);
            triggerEmoji(lastReaction.type, reactionPlayer?.symbol || (rUserId === String(room?.players[0].userId) ? 'X' : 'O'));
        }
    };

    useEffect(() => {
        let interval;
        if (mode === 'online' && room?._id && winner === null) {
            interval = setInterval(async () => {
                const res = await fetch(`/api/games/xo/current?roomId=${room._id}`);
                const data = await res.json();
                if (data.success) {
                    syncRoom(data.data);
                }
            }, 1500); // Polling faster
        }
        return () => clearInterval(interval);
    }, [mode, room?._id, winner]);

    const getPlayerEmoji = (symbol, type) => {
        const sets = {
            X: { laugh: '😂', angry: '😠', cry: '😢' },
            O: { laugh: '😂', angry: '😠', cry: '😢' }
        };
        return sets[symbol]?.[type] || '😊';
    };

    const triggerEmoji = (emojiType, fromSymbol = null) => {
        // If fromSymbol is provided (remote action), use it. Otherwise use my own symbol or current player.
        const symbol = fromSymbol || (mode === 'online' ? mySymbol : currentPlayer);
        const emojiIcon = getPlayerEmoji(symbol, emojiType);
        
        setActiveEmoji(emojiIcon);
        setTimeout(() => setActiveEmoji(null), 3000);
        
        // Only trigger network action if it's a local click
        if (!fromSymbol && mode === 'online' && room) {
            fetch('/api/games/xo/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: room._id, action: 'react', type: emojiType })
            });
        }
    };

    const copyRoomCode = () => {
        if (room?.roomCode) {
            navigator.clipboard.writeText(room.roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (gameState === "mode-selection") {
        return (
            <div className={styles.xoWrapper}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <div className={styles.gameLogo}>XO 4x4 <span style={{fontSize: '0.8rem', opacity: 0.7}}>V1.1</span></div>
                        <Link href="/games" className={styles.btn}>Quitter</Link>
                    </div>
                    <div className={styles.setupCard}>
                        <h2>Choisissez votre défi</h2>
                        <div className={styles.modeSelection}>
                            {(!xoConfig || xoConfig.modes === 'both' || xoConfig.modes === 'presence') && (
                                <button className={styles.modeBtn} onClick={() => { setMode('presence'); setGameState('setup-presence'); }}>
                                    <Users size={40} />
                                    <h3>Mode Présentiel</h3>
                                    <p>Sur le même appareil</p>
                                </button>
                            )}
                            {(!xoConfig || xoConfig.modes === 'both' || xoConfig.modes === 'online') && (
                                <button className={styles.modeBtn} onClick={() => { setMode('online'); setGameState('setup-online'); }}>
                                    <Monitor size={40} />
                                    <h3>Mode En Ligne</h3>
                                    <p>Défiez un membre ATA</p>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === "setup-presence" || gameState === "setup-online") {
        return (
            <div className={styles.xoWrapper}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <button className={styles.btn} onClick={() => setGameState("mode-selection")}><ArrowLeft size={16} /> Retour</button>
                        <div className={styles.gameLogo}>Configuration</div>
                    </div>
                    
                    <div className={{display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center'}}>
                        {mode === 'presence' ? (
                            <div className={styles.setupCard} style={{maxWidth: '500px', margin: '50px auto'}}>
                                <h3 style={{marginBottom: '30px'}}>Entrez les noms</h3>
                                <input className={styles.input} placeholder="Joueur 1 (X)" value={players.X.name} onChange={e => setPlayers({...players, X: {...players.X, name: e.target.value}})} />
                                <input className={styles.input} placeholder="Joueur 2 (O)" value={players.O.name} onChange={e => setPlayers({...players, O: {...players.O, name: e.target.value}})} />
                                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setGameState("playing")} style={{width: '100%'}}>Démarrer</button>
                            </div>
                        ) : (
                            <div className={styles.setupCard} style={{maxWidth: '500px', margin: '50px auto'}}>
                                <h3>Mode En Ligne</h3>
                                {error && <div style={{color: '#ff4444', marginBottom: '10px'}}>{error}</div>}
                                
                                <div style={{marginBottom: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px'}}>
                                    <h4>Créer une partie</h4>
                                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={createOnlineRoom} disabled={loading} style={{width: '100%', marginTop: '10px'}}>
                                        {loading ? 'Chargement...' : 'Générer un Code'}
                                    </button>
                                </div>

                                <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px'}}>
                                    <h4>Rejoindre une partie</h4>
                                    <input className={styles.input} placeholder="ENTREZ LE CODE..." value={roomCode} onChange={e => setRoomCode(e.target.value)} style={{textAlign: 'center', letterSpacing: '4px', marginTop: '10px'}} />
                                    <button className={styles.btn} onClick={joinOnlineRoom} disabled={loading || !roomCode} style={{width: '100%'}}>Rejoindre</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.xoWrapper}>
            {activeEmoji && (
                <div key={`${activeEmoji}-${Date.now()}`} className={styles.animatedEmoji}>
                    {activeEmoji}
                </div>
            )}

            <div className={styles.container}>
                <div className={styles.topBar}>
                    <button className={styles.btn} onClick={() => {
                        if (confirm("Quitter la partie ?")) window.location.href='/games';
                    }}><ArrowLeft size={16} /> Quitter</button>
                    
                    {mode === 'online' && room && (
                        <div className={styles.roomBadge} onClick={copyRoomCode} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(96, 165, 250, 0.2)', padding: '5px 15px', borderRadius: '20px', border: '1px solid #60a5fa' }}>
                            CODE: <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{room.roomCode}</span>
                            {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} color="#60a5fa" />}
                        </div>
                    )}
                    
                    <div className={styles.gameLogo}>XO STRATEGY</div>
                    {mode === 'presence' && <button className={styles.btn} onClick={resetGame}><RotateCcw size={16} /></button>}
                </div>

                <div className={styles.reservesRow}>
                    <div className={`${styles.playerInfo} ${currentPlayer === 'X' ? styles.activePlayerX : ''}`}>
                        <div style={{fontWeight: 'bold', color: '#ef4444'}}>X - {players.X.name} {mode === 'online' && mySymbol === 'X' && '(Moi)'}</div>
                        <div className={styles.reservePieces}>
                            {[...Array(INITIAL_PIECES)].map((_, i) => (
                                <div key={i} className={`${styles.pieceDot} ${i < players.X.reserve ? styles.pieceDotActive : ''}`} style={{backgroundColor: '#ef4444'}} />
                            ))}
                        </div>
                        {/* Player X Emojis */}
                        <div className={styles.playerEmojiBar}>
                            <button className={styles.miniEmojiBtn} onClick={() => triggerEmoji('laugh', 'X')}>😂</button>
                            <button className={styles.miniEmojiBtn} onClick={() => triggerEmoji('angry', 'X')}>😠</button>
                            <button className={styles.miniEmojiBtn} onClick={() => triggerEmoji('cry', 'X')}>😢</button>
                        </div>
                    </div>

                    <div style={{fontSize: '0.8rem', opacity: 0.6}}>
                        {mode === 'online' && room?.status === 'waiting' ? 'En attente...' : (phase === 'placement' ? 'Placement' : 'Mouvement')}
                    </div>

                    <div className={`${styles.playerInfo} ${currentPlayer === 'O' ? styles.activePlayerO : ''}`}>
                        <div style={{fontWeight: 'bold', color: '#3b82f6'}}>O - {players.O.name} {mode === 'online' && mySymbol === 'O' && '(Moi)'}</div>
                        <div className={styles.reservePieces}>
                            {[...Array(INITIAL_PIECES)].map((_, i) => (
                                <div key={i} className={`${styles.pieceDot} ${i < players.O.reserve ? styles.pieceDotActive : ''}`} style={{backgroundColor: '#3b82f6'}} />
                            ))}
                        </div>
                        {/* Player O Emojis */}
                        <div className={styles.playerEmojiBar}>
                            <button className={styles.miniEmojiBtn} onClick={() => triggerEmoji('laugh', 'O')}>😂</button>
                            <button className={styles.miniEmojiBtn} onClick={() => triggerEmoji('angry', 'O')}>😠</button>
                            <button className={styles.miniEmojiBtn} onClick={() => triggerEmoji('cry', 'O')}>😢</button>
                        </div>
                    </div>
                </div>

                {winner ? (
                    <div className={styles.setupCard} style={{background: 'rgba(34, 197, 94, 0.2)', borderColor: '#4ade80', marginTop: '0', marginBottom: '20px', padding: '15px'}}>
                        <Trophy style={{color: '#fbbf24', verticalAlign: 'middle', marginRight: '10px'}} />
                        <span style={{fontWeight: 'bold', color: '#4ade80'}}>Victoire pour {winner === 'X' ? players.X.name : players.O.name} !</span>
                    </div>
                ) : mode === 'online' && room?.status === 'waiting' ? (
                    <div style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '20px'}}>En attente du second joueur...</div>
                ) : (
                    <div style={{minHeight: '24px', color: '#60a5fa', marginBottom: '20px', fontWeight: 'bold'}}>
                        {currentPlayer === 'X' ? players.X.name : players.O.name}, à vous !
                    </div>
                )}

                <div className={styles.gameBoard}>
                    {board.map((row, r) => (
                        row.map((cell, c) => {
                            const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                            const isWinning = winningLine.some(l => l[0] === r && l[1] === c);
                            
                            return (
                                <div 
                                    key={`${r}-${c}`} 
                                    className={`${styles.cell} ${isSelected ? styles.cellSelected : ''}`}
                                    style={{
                                        boxShadow: isWinning ? `0 0 25px ${cell === 'X' ? '#ef4444' : '#3b82f6'}` : '',
                                        borderColor: isWinning ? (cell === 'X' ? '#ef4444' : '#3b82f6') : ''
                                    }}
                                    onClick={() => handleCellClick(r, c)}
                                >
                                    {cell && (
                                        <span className={cell === 'X' ? styles.symbolX : styles.symbolO}>
                                            {cell}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    ))}
                </div>

                {/* Shared reaction bar removed in favor of individual bars */}

                {error && <div style={{color: '#ef4444', fontSize: '0.9rem', marginTop: '10px'}}>{error}</div>}
                
                <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px', opacity: 0.6}}>
                     <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Play size={14}/> {phase === 'placement' ? 'Étape: Placement' : 'Étape: Déplacement'}</div>
                     <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Info size={14}/> Éjection par clic direct</div>
                </div>
            </div>
        </div>
    );
}
