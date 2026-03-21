"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './barbechni.module.css';
import { 
    Users, Monitor, ArrowLeft, Send, Hash, Play, Info, Copy, Check, 
    HelpCircle, AlertTriangle, EyeOff, Eye, User, Lock, Shuffle, 
    Smartphone, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#7c3aed', '#ec4899', '#06b6d4', '#8b5cf6', '#4ade80'];
const ICONS = ['🦁', '🦊', '🦄', '🐝', '🎨', '🎭', '🎸', '🚀', '🌈', '💎', '🔥', '⚡'];

const TRANSLATIONS = {
    fr: {
        title: "Barbechni !",
        subtitle: "Exprimez-vous, anonymement ou non !",
        chooseMode: "Choisissez votre mode",
        presential: "Mode Présentiel",
        online: "Mode En Ligne",
        presentialDesc: "Un seul appareil pour tous les joueurs",
        onlineDesc: "Chacun joue sur son propre appareil",
        back: "Retour",
        setup: "Configuration",
        gmTools: "Outils du Maître",
        numPlayers: "Nombre de joueurs",
        selectPlayers: "Sélectionner les joueurs",
        addPlayer: "Ajouter un joueur",
        start: "Démarrer le jeu",
        passDevice: "Passez l'appareil à :",
        yourCard: "C'est votre tour !",
        cardType: "Type de carte",
        question: "Question",
        reclamation: "Réclamation",
        writeMessage: "Rédigez votre message...",
        selectRecipient: "À qui envoyer ?",
        ready: "Je suis prêt !",
        hidden: "Carte masquée",
        readingPhase: "Phase de Lecture",
        votesActive: "Vote en cours...",
        showName: "Afficher l'expéditeur ?",
        yes: "OUI",
        no: "NON",
        revealResult: "Résultat du vote",
        anonymous: "ANONYME",
        revealed: "RÉVÉLÉ",
        nextCard: "Carte suivante",
        copyCode: "Copier le code",
        copied: "Copié !",
        waitingPlayers: "En attente des joueurs...",
        joinRoom: "Rejoindre une partie",
        createRoom: "Créer une partie",
        enterCode: "Code de la room",
        allSumbitted: "Tout le monde a écrit sa carte !",
        anonymousMsg: "Message anonyme",
        from: "De :",
        to: "À :",
        reply: "Votre réponse (optionnel)..."
    },
    en: {
        title: "Barbechni !",
        subtitle: "Speak your mind, anonymously or not!",
        chooseMode: "Choose your mode",
        presential: "Presential Mode",
        online: "Online Mode",
        presentialDesc: "One device for all players",
        onlineDesc: "Everyone plays on their own device",
        back: "Back",
        setup: "Setup",
        gmTools: "GM Tools",
        numPlayers: "Number of players",
        selectPlayers: "Select Players",
        addPlayer: "Add Player",
        start: "Start Game",
        passDevice: "Pass device to:",
        yourCard: "It's your turn!",
        cardType: "Card Type",
        question: "Question",
        reclamation: "Reclamation",
        writeMessage: "Write your message...",
        selectRecipient: "Send to who?",
        ready: "I'm ready!",
        hidden: "Card Hidden",
        readingPhase: "Reading Phase",
        votesActive: "Voting active...",
        showName: "Show sender's name?",
        yes: "YES",
        no: "NO",
        revealResult: "Vote result",
        anonymous: "ANONYMOUS",
        revealed: "REVEALED",
        nextCard: "Next card",
        copyCode: "Copy Code",
        copied: "Copied!",
        waitingPlayers: "Waiting for players...",
        joinRoom: "Join a room",
        createRoom: "Create a room",
        enterCode: "Room Code",
        allSumbitted: "Everyone submitted their cards!",
        anonymousMsg: "Anonymous Message",
        from: "From:",
        to: "To:",
        reply: "Your reply (optional)..."
    },
    ar: {
        title: "بربشني !",
        subtitle: "عبّر عن نفسك، بهوية مخفية أو ظاهرة !",
        chooseMode: "اختر نوع اللعبة",
        presential: "نمط حضوري",
        online: "نمط عبر الإنترنت",
        presentialDesc: "جهاز واحد لجميع اللاعبين",
        onlineDesc: "كل لاعب على جهازه الخاص",
        back: "رجوع",
        setup: "الإعدادات",
        gmTools: "أدوات المدير",
        numPlayers: "عدد اللاعبين",
        selectPlayers: "اختر اللاعبين",
        addPlayer: "إضافة لاعب",
        start: "ابدأ اللعبة",
        passDevice: "مرر الجهاز إلى:",
        yourCard: "دورك الآن !",
        cardType: "نوع البطاقة",
        question: "سؤال",
        reclamation: "تظلم",
        writeMessage: "اكتب رسالتك...",
        selectRecipient: "إلى من ترسل ؟",
        ready: "أنا جاهز !",
        hidden: "البطاقة مخفية",
        readingPhase: "مرحلة القراءة",
        votesActive: "التصويت جارٍ...",
        showName: "إظهار اسم المرسل ؟",
        yes: "نعم",
        no: "لا",
        revealResult: "نتيجة التصويت",
        anonymous: "مجهول",
        revealed: "كشف الهوية",
        nextCard: "البطاقة التالية",
        copyCode: "نسخ الكود",
        copied: "تم النسخ !",
        waitingPlayers: "في انتظار اللاعبين...",
        joinRoom: "انضمام للغرفة",
        createRoom: "إنشاء غرفة",
        enterCode: "كود الغرفة",
        allSumbitted: "الجميع أكمل البطاقات !",
        anonymousMsg: "رسالة مجهولة",
        from: "من :",
        to: "إلى :",
        reply: "ردك (اختياري)..."
    }
};

export default function BarbechniGame({ user }) {
    const [lang, setLang] = useState('fr');
    const [gameState, setGameState] = useState("mode-selection");
    const [mode, setMode] = useState(null);
    const [players, setPlayers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [room, setRoom] = useState(null);
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    
    // Writing state (shared for presential)
    const [currentWritingPlayerIndex, setCurrentWritingPlayerIndex] = useState(0);
    const [currentWritingSecret, setCurrentWritingSecret] = useState({
        type: 'question',
        content: '',
        recipientId: ''
    });
    const [isCardHidden, setIsCardHidden] = useState(false);
    
    const t = TRANSLATIONS[lang];
    const isRtl = lang === 'ar';

    useEffect(() => {
        fetch('/api/games/barbechni/users')
            .then(res => res.json())
            .then(setAvailableUsers);
        
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                const config = data.games?.barbechni;
                if (config?.modes === 'presence') setMode('presence');
                else if (config?.modes === 'online') setMode('online');
            });
    }, []);

    // Polling for online mode
    useEffect(() => {
        if (mode === 'online' && (gameState === 'setup-online' || gameState === 'playing-online')) {
            const interval = setInterval(async () => {
                if (!room?._id) return;
                const res = await fetch(`/api/games/barbechni/current?roomId=${room._id}`);
                const data = await res.json();
                if (data && !data.error) setRoom(data);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [mode, gameState, room?._id]);

    // --- Actions ---

    const createOnlineRoom = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/games/barbechni/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    createdBy: user._id,
                    players: [{
                        _id: user._id,
                        name: user.name,
                        photo: user.photo,
                        club: user.club,
                        color: COLORS[0],
                        icon: ICONS[0],
                        isGM: true
                    }]
                })
            });
            const data = await res.json();
            setRoom(data);
            setGameState('setup-online');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const joinOnlineRoom = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/games/barbechni/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode,
                    player: {
                        _id: user._id,
                        name: user.name,
                        photo: user.photo,
                        club: user.club,
                        color: COLORS[Math.floor(Math.random()*COLORS.length)],
                        icon: ICONS[Math.floor(Math.random()*ICONS.length)]
                    }
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setRoom(data);
            setGameState('setup-online');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const submitOnlineCard = async () => {
        if (!currentWritingSecret.content || !currentWritingSecret.recipientId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/games/barbechni/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: room._id,
                    type: 'SUBMIT_CARD',
                    card: {
                        senderId: user._id,
                        recipientId: currentWritingSecret.recipientId,
                        type: currentWritingSecret.type,
                        content: currentWritingSecret.content
                    }
                })
            });
            const data = await res.json();
            if (data && !data.error) setRoom(data);
            setIsCardHidden(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (vote) => {
        if (mode === 'online') {
            try {
                await fetch('/api/games/barbechni/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomId: room._id,
                        type: 'VOTE',
                        fromId: user._id,
                        vote
                    })
                });
            } catch (err) {}
        } else {
            // Local mode presential vote
            const newRoom = JSON.parse(JSON.stringify(room));
            const idx = room.currentCardIndex || 0;
            const currentCard = newRoom.cards[idx];
            
            // SECURITY: Get players count from room or local state
            const totalPlayersCount = (room?.players || players || []).length;

            if (currentCard && currentCard.votingActive) {
                if (vote === 'yes') currentCard.voteResults.yes.push("local_" + Date.now());
                else currentCard.voteResults.no.push("local_" + Date.now());
                
                currentCard.voteResults.total = currentCard.voteResults.yes.length + currentCard.voteResults.no.length;
                
                // If everyone voted (use totalPlayersCount secured above)
                if (currentCard.voteResults.total >= totalPlayersCount) {
                    currentCard.votingActive = false;
                    if (currentCard.voteResults.yes.length > currentCard.voteResults.no.length) {
                        currentCard.isAnonymous = false;
                    }
                }
                setRoom(newRoom);
            }
        }
    };

    // --- UI Helpers ---

    if (gameState === "mode-selection") {
        return (
            <div className={`${styles.barbechniWrapper} ${isRtl ? styles.rtl : ''}`}>
                <div className={styles.container}>
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '20px'}}>
                        {['fr', 'en', 'ar'].map(l => (
                            <button key={l} className={styles.btn} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
                        ))}
                    </div>
                    
                    <div className={styles.setupCard}>
                        <h1 className={styles.gameLogo}>{t.title}</h1>
                        <p>{t.subtitle}</p>
                        <h2 style={{marginTop: '30px'}}>{t.chooseMode}</h2>
                        <div className={styles.modeSelection}>
                            <button className={styles.modeBtn} onClick={() => { setMode('presence'); setGameState('setup-presence'); }}>
                                <Users size={40} />
                                <h3>{t.presential}</h3>
                                <p>{t.presentialDesc}</p>
                            </button>
                            <button className={styles.modeBtn} onClick={() => { setMode('online'); setGameState('online-menu'); }}>
                                <Monitor size={40} />
                                <h3>{t.online}</h3>
                                <p>{t.onlineDesc}</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'setup-presence') {
        return (
            <div className={`${styles.barbechniWrapper} ${isRtl ? styles.rtl : ''}`}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                         <button className={styles.btn} onClick={() => setGameState("mode-selection")}><ArrowLeft size={16} /> {t.back}</button>
                         <div className={styles.gameLogo}>{t.setup}</div>
                    </div>
                    
                    <div className={styles.setupCard}>
                         <h3>{t.selectPlayers}</h3>
                         <div style={{maxWidth: '400px', marginInline: 'auto', marginTop: '20px'}}>
                             <label>{t.numPlayers}</label>
                             <input type="number" className={styles.input} min="3" max="15" value={players.length} disabled />
                             
                             <div style={{textAlign: 'left', marginBottom: '10px'}}>
                                 {players.map((p, i) => (
                                     <div key={i} style={{marginBottom: '5px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                                         <div style={{width: '30px', height: '30px', borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{p.icon}</div>
                                         <select className={styles.input} style={{marginBottom: 0, flex: 1}} value={p._id} onChange={e => {
                                             const u = availableUsers.find(au => au._id === e.target.value);
                                             const newPlayers = [...players];
                                             newPlayers[i] = { ...u, color: p.color, icon: p.icon };
                                             setPlayers(newPlayers);
                                         }}>
                                             <option value="">-- {t.addPlayer} --</option>
                                             {Object.entries(
                                                 availableUsers.reduce((groups, u) => {
                                                     const club = u.club || 'Sans Club';
                                                     if (!groups[club]) groups[club] = [];
                                                     groups[club].push(u);
                                                     return groups;
                                                 }, {})
                                             ).map(([club, users]) => (
                                                 <optgroup key={club} label={club}>
                                                     {users.map(u => (
                                                         <option key={u._id} value={u._id}>{u.name}</option>
                                                     ))}
                                                 </optgroup>
                                             ))}
                                         </select>
                                         <button className={styles.btn} style={{padding: '5px'}} onClick={() => setPlayers(players.filter((_, idx) => idx !== i))}>❌</button>
                                     </div>
                                 ))}
                             </div>

                             <button className={styles.btn} style={{width: '100%', marginBottom: '20px'}} onClick={() => {
                                 setPlayers([...players, { _id: '', name: '', color: COLORS[players.length % COLORS.length], icon: ICONS[players.length % ICONS.length] }]);
                             }}>{t.addPlayer}</button>

                             {players.length >= 3 && players.every(p => p._id) && (
                                 <button className={`${styles.btn} ${styles.btnPrimary}`} style={{width: '100%'}} onClick={() => setGameState("writing")}>
                                     {t.start}
                                 </button>
                             )}
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'online-menu') {
        return (
            <div className={`${styles.barbechniWrapper} ${isRtl ? styles.rtl : ''}`}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <button className={styles.btn} onClick={() => setGameState("mode-selection")}><ArrowLeft size={16} /> {t.back}</button>
                        <div className={styles.gameLogo}>{t.title}</div>
                    </div>
                    <div className={styles.setupCard} style={{maxWidth: '500px', margin: '50px auto'}}>
                        <h3>{t.online}</h3>
                        {error && <div style={{color: '#ff4444'}}>{error}</div>}
                        <button className={`${styles.btn} ${styles.btnPrimary}`} style={{width: '100%', padding: '20px', fontSize: '1.2rem', marginBottom: '20px'}} onClick={createOnlineRoom}>
                            <Play size={20} /> {t.createRoom}
                        </button>
                        <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px'}}>
                            <h4>{t.joinRoom}</h4>
                            <input className={styles.input} value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder={t.enterCode} style={{textAlign: 'center', letterSpacing: '4px'}} />
                            <button className={styles.btn} style={{width: '100%'}} onClick={joinOnlineRoom}>{t.joinRoom}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'setup-online' && room?.status === 'waiting') {
        const isGM = room.createdBy === user._id;
        return (
            <div className={`${styles.barbechniWrapper} ${isRtl ? styles.rtl : ''}`}>
                <div className={styles.container}>
                   <div className={styles.topBar}>
                        <div className={styles.gameLogo}>{t.title}</div>
                        <div style={{display: 'flex', gap: '10px'}}>
                             <div className={styles.btn} onClick={() => {navigator.clipboard.writeText(room.roomCode); setCopied(true); setTimeout(() => setCopied(false), 2000)}}>
                                {copied ? <Check size={16} /> : <Copy size={16} />} {room.roomCode}
                             </div>
                        </div>
                    </div>
                    
                    <div className={styles.setupCard}>
                        <h2>{t.waitingPlayers} ({room.players.length})</h2>
                        <div className={styles.cardGrid} style={{marginTop: '30px'}}>
                            {room.players.map(p => (
                                <div key={p._id} className={styles.playerCard} style={{borderColor: p.color}}>
                                    <div className={styles.cardIcon}>{p.icon}</div>
                                    <h4>{p.name}</h4>
                                    <span style={{fontSize: '0.8rem', opacity: 0.6}}>{p.club}</span>
                                </div>
                            ))}
                        </div>
                        {isGM && room.players.length >= 2 && (
                            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{marginTop: '40px', width: '200px', marginInline: 'auto'}} 
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const res = await fetch('/api/games/barbechni/action', {
                                            method: 'POST', 
                                            headers: {'Content-Type': 'application/json'},
                                            body: JSON.stringify({roomId: room._id, type: 'START_WRITING'})
                                        });
                                        const data = await res.json();
                                        if (data && !data.error) setRoom(data);
                                    } catch (err) {
                                        setError("Erreur lors du démarrage : " + err.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}>
                                {loading ? "..." : t.start}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (room?.status === 'writing' || gameState === 'writing') {
        // Shared interface for cards
        const onlineSubmitted = room?.cards?.some(c => c.senderId === user._id);
        const currentTarget = mode === 'presence' ? players[currentWritingPlayerIndex] : user;
        
        return (
            <div className={`${styles.barbechniWrapper} ${isRtl ? styles.rtl : ''}`}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <div className={styles.gameLogo}>{t.title}</div>
                        {mode === 'presence' ? <div>{currentWritingPlayerIndex + 1} / {players.length}</div> : <div>{room.cards.length} / {room.players.length}</div>}
                    </div>

                    <div className={styles.writingBox}>
                        {(mode === 'online' && onlineSubmitted) || isCardHidden ? (
                            <div className={styles.cardPreview} onClick={() => mode === 'presence' ? setIsCardHidden(false) : null}>
                                <div className={styles.cardInner}>
                                    <div className={styles.cardFront}>
                                        <Lock size={50} />
                                        <h3>{t.hidden}</h3>
                                        <p>{t.ready}</p>
                                    </div>
                                </div>
                                {mode === 'presence' && currentWritingPlayerIndex < players.length - 1 && (
                                    <button className={styles.btnPrimary} style={{width: '100%', marginTop: '50px'}} onClick={() => {
                                        const newPlayers = [...players];
                                        newPlayers[currentWritingPlayerIndex] = {
                                            ...newPlayers[currentWritingPlayerIndex],
                                            tempSecret: currentWritingSecret
                                        };
                                        setPlayers(newPlayers);
                                        
                                        setCurrentWritingPlayerIndex(currentWritingPlayerIndex + 1);
                                        setIsCardHidden(false);
                                        setCurrentWritingSecret({type: 'question', content: '', recipientId: ''});
                                    }}>{t.passDevice} {players[currentWritingPlayerIndex + 1]?.name}</button>
                                )}
                                {mode === 'presence' && currentWritingPlayerIndex === players.length - 1 && (
                                    <button className={styles.btnPrimary} style={{width: '100%', marginTop: '50px'}} onClick={async () => {
                                        // Finalize presence mode
                                        setLoading(true);
                                        const finalCards = players.map(p => {
                                            const secret = p._id === players[currentWritingPlayerIndex]._id ? currentWritingSecret : (p.tempSecret || {});
                                            return {
                                                senderId: p._id,
                                                recipientId: secret.recipientId,
                                                type: secret.type,
                                                content: secret.content,
                                                isAnonymous: true,
                                                votingActive: false,
                                                voteResults: { yes: [], no: [], total: 0 }
                                            };
                                        });
                                        
                                        setGameState('reading');
                                        setRoom({
                                            ...room, 
                                            players: players.map(p => ({...p})), // Ensure players are saved in room
                                            cards: finalCards, 
                                            status: 'reading', 
                                            currentCardIndex: 0
                                        });
                                        setLoading(false);
                                    }}>{t.ready}</button>
                                )}
                            </div>
                        ) : (
                            <>
                                <h2>{isRtl ? 'اكتب بطاقتك' : 'Crée ta carte'}</h2>
                                <h3 style={{color: '#7c3aed'}}>{currentTarget?.name}</h3>
                                <div className={styles.typeSelector}>
                                    <button className={`${styles.typeBtn} ${currentWritingSecret.type === 'question' ? styles.active : ''}`} 
                                        onClick={() => setCurrentWritingSecret({...currentWritingSecret, type: 'question'})} style={{color: '#3b82f6'}}>
                                        <HelpCircle /> {t.question}
                                    </button>
                                    <button className={`${styles.typeBtn} ${currentWritingSecret.type === 'reclamation' ? styles.active : ''}`} 
                                        onClick={() => setCurrentWritingSecret({...currentWritingSecret, type: 'reclamation'})} style={{color: '#f59e0b'}}>
                                        <AlertTriangle /> {t.reclamation}
                                    </button>
                                </div>
                                <textarea className={styles.input} rows="4" value={currentWritingSecret.content || ''} 
                                    onChange={e => setCurrentWritingSecret({...currentWritingSecret, content: e.target.value})} placeholder={t.writeMessage}></textarea>
                                
                                <h4 style={{marginBottom: '5px'}}>{t.selectRecipient}</h4>
                                <select className={styles.input} value={currentWritingSecret.recipientId || ''} onChange={e => setCurrentWritingSecret({...currentWritingSecret, recipientId: e.target.value})}>
                                    <option value="">-- {t.selectRecipient} --</option>
                                    {(mode === 'online' ? room.players : players).filter(p => String(p._id) !== String(mode === 'online' ? user._id : players[currentWritingPlayerIndex]._id)).map((p, i) => (
                                        <option key={`${p._id}_${i}`} value={p._id}>{p.name}</option>
                                    ))}
                                </select>

                                <button className={`${styles.btn} ${styles.btnPrimary}`} style={{width: '100%', marginTop: '20px'}} 
                                    disabled={!currentWritingSecret.content || !currentWritingSecret.recipientId}
                                    onClick={mode === 'online' ? submitOnlineCard : () => setIsCardHidden(true)}>
                                    {t.ready}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (room?.status === 'reading') {
        const currentCard = (room.cards || [])[room.currentCardIndex || 0];
        if (!currentCard) {
            return (
                <div className={styles.barbechniWrapper}>
                    <div className={styles.container}>
                        <div className={styles.setupCard}>{t.waitingPlayers}</div>
                    </div>
                </div>
            );
        }

        // --- NEW PASS DEVICE TRANSITION FOR PRESENTIAL ---
        const allPlayers = room.players?.length ? room.players : (players || []);
        const recipient = allPlayers.find(p => String(p._id) === String(currentCard.recipientId));
        const sender = allPlayers.find(p => String(p._id) === String(currentCard.senderId));

        if (mode === 'presence' && !currentCard.isRead) {
            return (
                <div className={styles.barbechniWrapper}>
                    <div className={styles.container}>
                        <div className={styles.setupCard} style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'}}>
                            <Smartphone size={80} style={{color: '#7c3aed', marginBottom: '30px'}} />
                            <h2>{t.passDevice}</h2>
                            <h1 style={{fontSize: '3rem', margin: '20px 0', color: recipient?.color || '#ffffff'}}>{recipient?.name || '...'}</h1>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{width: '200px', margin: '40px auto'}} onClick={() => {
                                const newRoom = JSON.parse(JSON.stringify(room));
                                newRoom.cards[room.currentCardIndex || 0].isRead = true;
                                setRoom(newRoom);
                            }}>{t.ready}</button>
                        </div>
                    </div>
                </div>
            );
        }
        
        return (
            <div className={`${styles.barbechniWrapper} ${isRtl ? styles.rtl : ''}`}>
                 <div className={styles.container}>
                    <div className={styles.topBar}>
                        <div className={styles.gameLogo}>{t.title}</div>
                        <div>{(room.currentCardIndex || 0) + 1} / {(room.cards || []).length}</div>
                    </div>

                    <div style={{textAlign: 'center', marginBottom: '40px'}}>
                        <h2 style={{color: '#7c3aed'}}>{t.to} {recipient?.name || '...'}</h2>
                    </div>

                    <div className={styles.writingBox} style={{border: '3px solid #7c3aed'}}>
                         <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
                            <span className={`${styles.badge} ${currentCard.type === 'question' ? styles.badgeQuestion : styles.badgeReclamation}`}>
                                {currentCard.type === 'question' ? t.question : t.reclamation}
                            </span>
                         </div>
                         <p style={{fontSize: '1.5rem', fontWeight: 600, fontStyle: 'italic'}}>{currentCard.content || '...'}</p>
                         
                         <div style={{marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px'}}>
                            {currentCard.isAnonymous ? (
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.5}}>
                                    <EyeOff size={20} /> {t.anonymousMsg}
                                </div>
                            ) : (
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'}}>
                                    <img src={sender?.photo || '/default-user.png'} style={{width: '40px', height: '40px', borderRadius: '50%'}} />
                                    <span>{t.from} <strong>{sender?.name || '...'}</strong></span>
                                </div>
                            )}
                         </div>

                         {currentCard.votingActive ? (
                             <div style={{marginTop: '30px', textAlign: 'center'}}>
                                <h3>{t.showName}</h3>
                                <div className={styles.voteActions}>
                                    <button className={`${styles.voteBtn} ${styles.voteBtnYes}`} onClick={() => handleVote('yes')}>
                                        <ThumbsUp /> {t.yes} ({currentCard.voteResults?.yes?.length || 0})
                                    </button>
                                    <button className={`${styles.voteBtn} ${styles.voteBtnNo}`} onClick={() => handleVote('no')}>
                                        <ThumbsDown /> {t.no} ({currentCard.voteResults?.no?.length || 0})
                                    </button>
                                </div>
                             </div>
                         ) : (room.createdBy === user._id || mode === 'presence') && (
                             <div style={{marginTop: '30px', display: 'flex', gap: '10px'}}>
                                <button className={styles.btn} style={{flex: 1}} 
                                    onClick={() => {
                                        if (mode === 'online') {
                                            fetch('/api/games/barbechni/action', {
                                                method: 'POST',
                                                headers: {'Content-Type': 'application/json'},
                                                body: JSON.stringify({roomId: room._id, type: 'ACTIVATE_VOTE'})
                                            });
                                        } else {
                                            // Handle local vote
                                            const newRoom = JSON.parse(JSON.stringify(room));
                                            const idx = room.currentCardIndex || 0;
                                            if (newRoom.cards && newRoom.cards[idx]) {
                                                newRoom.cards[idx].votingActive = true;
                                                setRoom(newRoom);
                                            }
                                        }
                                    }}>Lance le vote</button>
                                <button className={styles.btnPrimary} style={{flex: 1}}
                                    onClick={() => {
                                        if (mode === 'online') {
                                            fetch('/api/games/barbechni/action', {
                                                method: 'POST',
                                                headers: {'Content-Type': 'application/json'},
                                                body: JSON.stringify({roomId: room._id, type: 'NEXT_CARD'})
                                            });
                                        } else {
                                            // Handle local next card
                                            const nextIdx = (room.currentCardIndex || 0) + 1;
                                            if (nextIdx >= room.cards.length) {
                                                setGameState('mode-selection'); // Or finished screen
                                            } else {
                                                setRoom({...room, currentCardIndex: nextIdx});
                                            }
                                        }
                                    }}>{t.nextCard}</button>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        );
    }

    if (room?.status === 'finished') {
        return (
            <div className={`${styles.barbechniWrapper} ${isRtl ? styles.rtl : ''}`}>
                 <div className={styles.container}>
                    <div className={styles.setupCard} style={{background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: 'white'}}>
                        <h1 style={{fontSize: '3rem', margin: '20px 0'}}>Jeu Terminé !</h1>
                        <p style={{fontSize: '1.2rem', opacity: 0.9}}>{t.allSumbitted}</p>
                        {(room.createdBy === user._id || mode === 'presence') && (
                            <button className={`${styles.btn}`} style={{width: '200px', margin: '40px auto', background: 'white', color: '#047857'}} onClick={() => {
                                setGameState('mode-selection');
                                setRoom(null);
                            }}>Nouvelle partie</button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.barbechniWrapper}>
             <div className={styles.container}>
                <div className={styles.setupCard}>
                    <h1>{t.title}</h1>
                    <p>Chargement du jeu...</p>
                </div>
             </div>
        </div>
    );
}
