"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./loup-garou.module.css";
import PlayerChatPanel from "./PlayerChatPanel";
import { 
  Users, 
  Monitor, 
  MapPin, 
  ArrowRight, 
  UserPlus, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Dna,
  Shuffle,
  Trash2,
  Lock,
  Search
} from "lucide-react";
import { ROLES, TEAMS } from "@/lib/games/loup-garou/roles";
import { useLanguage } from "@/context/LanguageContext";

export default function LoupGarouGame({ user }) {
  const { t, language } = useLanguage();
  const [gameState, setGameState] = useState("mode-selection"); // mode-selection, setup-presence, setup-online, distribution, board
  const [mode, setMode] = useState(null); // 'online', 'presence'
  const [players, setPlayers] = useState([]); // Array of { name, userId }
  const [rolePool, setRolePool] = useState([]); // Array of role objects
  const [availableMembers, setAvailableMembers] = useState([]);
  const [searchMember, setSearchMember] = useState("");
  const [distributingIndex, setDistributingIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [gameRoom, setGameRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gamesConfig, setGamesConfig] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCustomRoleForm, setShowCustomRoleForm] = useState(false);
  const [sessionCustomRoles, setSessionCustomRoles] = useState([]);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [customRoleData, setCustomRoleData] = useState({
    name: { fr: '', en: '', ar: '' },
    description: { fr: '', en: '', ar: '' },
    icon: '👤',
    canHaveMultiple: false,
    team: TEAMS.VILLAGE
  });
  const [boardTab, setBoardTab] = useState("game"); // "game" or "chat" for mobile toggle

  // Derived state
  const myPlayer = mode === 'online' ? gameRoom?.players?.find(p => p.userId?.toString() === (user?.userId || user?._id)?.toString()) : null;
  const isMaster = user && gameRoom?.creatorId?.toString() === (user?.userId || user?._id)?.toString();
  const isAlivePlayer = myPlayer ? myPlayer.isAlive : true;
  const currentGamePlayers = mode === 'online' ? (gameRoom?.players || []) : players;

  // --- Auth Check ---
  const isAuthorized = !!user;

  // --- Initialization ---
  useEffect(() => {
    // Check for active online game
    const checkActiveGame = async () => {
        try {
            const res = await fetch('/api/games/loup-garou/current');
            const data = await res.json();
            if (data.success && data.data) {
                setGameRoom(data.data);
                setMode('online');
                // Check if user is MJ or just a player
                if (data.data.creatorId === (user?.userId || user?._id)) {
                    setGameState('board'); 
                } else {
                    setGameState('invited');
                }
            }
        } catch (err) {
            console.error("Error checking active game:", err);
        }
    };
    checkActiveGame();

    // Default role pool: Wolf x2, Villageois x4, Voyante, Sorcière
    const defaultPool = [
      ...ROLES.filter(r => r.id === 'loup-garou').map(r => ({ ...r })),
      ...ROLES.filter(r => r.id === 'loup-garou').map(r => ({ ...r })),
      ...ROLES.filter(r => r.id === 'voyante'),
      ...ROLES.filter(r => r.id === 'sorciere'),
      ...ROLES.filter(r => r.id === 'simple-villageois').map(r => ({ ...r })),
      ...ROLES.filter(r => r.id === 'simple-villageois').map(r => ({ ...r })),
      ...ROLES.filter(r => r.id === 'simple-villageois').map(r => ({ ...r })),
      ...ROLES.filter(r => r.id === 'simple-villageois').map(r => ({ ...r }))
    ];
    setRolePool(defaultPool);
  }, []);

  // Fetch members for online mode
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setAvailableMembers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/admin/settings')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data?.games) {
                setGamesConfig(data.games);
                
                // Check if role is authorized
                if (!user?.role || !data.games.authorizedRoles.includes(user.role)) {
                    if (user?.role !== 'admin') {
                        setError("Vous n'avez pas l'autorisation d'accéder aux jeux.");
                        setGameState("forbidden");
                    }
                }

                // Auto-set mode if only one is allowed
                if (data.games.loupGarou.modes === 'presence') {
                    setMode('presence');
                    setGameState('setup-presence');
                } else if (data.games.loupGarou.modes === 'online') {
                    setMode('online');
                    setGameState('setup-online');
                }
            }
        });
  }, [user?.role]);

  useEffect(() => {
    if (gameState === "setup-online") {
      fetchMembers();
    }
  }, [gameState]);

  const handleAddCustomRole = (e) => {
    e.preventDefault();
    if (!customRoleData.name.fr) return;
    
    const newRole = {
        ...customRoleData,
        id: `custom-${Date.now()}`
    };
    
    // Available only for THIS session
    setSessionCustomRoles([...sessionCustomRoles, newRole]);

    addRoleToPool(newRole);
    setShowCustomRoleForm(false);
    // Reset form
    setCustomRoleData({
        name: { fr: '', en: '', ar: '' },
        description: { fr: '', en: '', ar: '' },
        icon: '👤',
        canHaveMultiple: false,
        team: TEAMS.VILLAGE
    });
  };

  const handleModeChoice = (selectedMode) => {
    // Check if mode is allowed by config
    if (gamesConfig && gamesConfig.loupGarou.modes !== 'both' && gamesConfig.loupGarou.modes !== selectedMode) {
        setError(`Le mode ${selectedMode === 'online' ? 'en ligne' : 'présentiel'} n'est pas autorisé par l'administration.`);
        return;
    }

    setMode(selectedMode);
    if (!user && selectedMode === 'online') {
        setError("Connectez-vous pour créer une partie en ligne.");
        return;
    }
    setError(null);
    setGameState(selectedMode === "online" ? "setup-online" : "setup-presence");
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const code = joinRoomCode.trim().toUpperCase();
    if (!code) return;
    
    setLoading(true);
    setError(null);
    try {
        const res = await fetch(`/api/games/loup-garou/current?roomCode=${code}`);
        const data = await res.json();
        if (data.success && data.data) {
            setGameRoom(data.data);
            setMode('online');
            if (data.data.creatorId === (user?.userId || user?._id)) {
                setGameState('board'); 
            } else {
                setGameState('invited');
            }
        } else {
            setError("Code invalide ou vous n'êtes pas sur la liste des joueurs !");
        }
    } catch(err) {
        setError("Erreur serveur.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (gameState === "board" && mode === 'online' && gameRoom?._id) {
        interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/games/loup-garou/current?roomId=${gameRoom._id}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.success && data.data) {
                    setGameRoom(data.data);
                }
            } catch(e) {}
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [gameState, mode, gameRoom?._id]);

  // Helpers & Actions
  const chatMessages = gameRoom?.chat || [];
  const generalChat = chatMessages.filter(m => !m.isDirectToMj);
  const privateMessages = chatMessages.filter(m => m.isDirectToMj);
  const myPrivateMessages = isMaster
      ? privateMessages               
      : privateMessages.filter(m => m.senderId === (user?.userId || user?._id)?.toString());

  const sendChat = async (message, isDirectToMj = false, type = 'text') => {
      if (!gameRoom?._id || (!isAlivePlayer && !isMaster)) return;
      await fetch('/api/games/loup-garou/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              roomId: gameRoom._id,
              field: 'send_chat',
              value: {
                  senderId: (user?.userId || user?._id)?.toString(),
                  senderName: user?.name || myPlayer?.name || 'Joueur',
                  message,
                  type,
                  isDirectToMj
              }
          })
      });
  };

  const startVote = async () => {
      if (!isMaster || !gameRoom?._id) return;
      await fetch('/api/games/loup-garou/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              roomId: gameRoom._id,
              field: 'vote_state',
              value: { isActive: true, votes: [], title: 'Le village vote !' }
          })
      });
  };

  const closeVote = async () => {
      if (!isMaster || !gameRoom?._id) return;
      const votes = gameRoom?.voteState?.votes || [];
      const tally = {};
      votes.forEach(v => { tally[v.targetId] = (tally[v.targetId] || 0) + 1; });
      const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
      const mostVotedId = sorted[0]?.[0];
      
      if (mostVotedId) {
          const idx = currentGamePlayers.findIndex(p => p.userId?.toString() === mostVotedId);
          if (idx > -1) {
              await fetch('/api/games/loup-garou/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ roomId: gameRoom._id, playerIndex: idx, field: 'isAlive', value: false })
              });
          }
      }

      await fetch('/api/games/loup-garou/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              roomId: gameRoom._id,
              field: 'vote_state',
              value: { isActive: false, votes: [], title: '' }
          })
      });
  };

  const submitVote = async (targetId) => {
      await fetch('/api/games/loup-garou/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: gameRoom._id, field: 'submit_vote', value: targetId })
      });
  };

  // Auto-close vote when everyone voted
  useEffect(() => {
    if (gameState === 'board' && isMaster && gameRoom?.voteState?.isActive) {
        const alivePlayers = (gameRoom?.players || []).filter(p => p.isAlive);
        const votes = gameRoom.voteState.votes || [];
        if (votes.length >= alivePlayers.length && alivePlayers.length > 0) {
            closeVote();
        }
    }
  }, [gameRoom?.voteState, gameState, isMaster]);

  const addManualPlayer = (e) => {
    e.preventDefault();
    const name = e.target.playerName.value.trim();
    if (name) {
      setPlayers([...players, { name, id: Date.now() }]);
      e.target.reset();
    }
  };

  const addMemberPlayer = (member) => {
    if (players.find(p => p.userId === member._id)) return;
    setPlayers([...players, { name: member.name, userId: member._id }]);
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => (p.id !== id && (!p.userId || p.userId !== id))));
  };

  const addRoleToPool = (role) => {
    setRolePool([...rolePool, { ...role, poolId: Date.now() }]);
  };

  const removeRoleFromPool = (poolId) => {
    const newPool = [...rolePool];
    const index = newPool.findIndex(r => r.poolId === poolId || (r.id === poolId && !r.poolId));
    if (index !== -1) newPool.splice(index, 1);
    setRolePool(newPool);
  };

  const startDistribution = async () => {
    if (players.length !== rolePool.length) {
      setError(`Le nombre de joueurs (${players.length}) doit correspondre au nombre de rôles (${rolePool.length}).`);
      return;
    }

    if (mode === 'online') {
        // Create in DB
        setLoading(true);
        try {
            const res = await fetch('/api/games/loup-garou/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    rolePool: rolePool.map(r => r.id),
                    players
                })
            });
            const data = await res.json();
            if (data.success) {
                setGameRoom(data.data);
                setGameState("board");
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Erreur lors de la création de la partie.");
        } finally {
            setLoading(false);
        }
    } else {
        // Presence: Distribution locally
        let shuffledRoles = [...rolePool].sort(() => Math.random() - 0.5);
        const playersWithRoles = players.map((p, i) => ({
            ...p,
            role: shuffledRoles[i],
            isRevealed: false,
            isAlive: true
        }));
        setPlayers(playersWithRoles);
        setGameState("distribution");
    }
  };

  const nextReveal = () => {
    setIsRevealing(false);
    setIsTransitioning(true);
    
    // Wait for the flip-back animation to complete (approx 800ms)
    setTimeout(() => {
        if (distributingIndex < players.length - 1) {
            setDistributingIndex(distributingIndex + 1);
            setIsTransitioning(false);
        } else {
            setGameState(mode === 'online' ? "board" : "awaiting-mj");
            setIsTransitioning(false);
        }
    }, 800);
  };

  const handleEndGame = async () => {
    if (confirm("Êtes-vous sûr de vouloir terminer cette partie définitivement ?")) {
        if (mode === 'online' && gameRoom?._id) {
            await fetch('/api/games/loup-garou/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: gameRoom._id, field: 'status', value: 'finished' })
            });
        }
        setGameRoom(null);
        
        if (gamesConfig && gamesConfig.loupGarou.modes === 'presence') {
            setGameState('setup-presence');
        } else if (gamesConfig && gamesConfig.loupGarou.modes === 'online') {
            setGameState('setup-online');
        } else {
            setGameState('mode-selection');
        }
    }
  };

  const handleNewGameFromBoard = async () => {
    if (confirm("Clôturer la partie actuelle et configurer une nouvelle manche avec les mêmes joueurs ?")) {
        if (mode === 'online' && gameRoom?._id) {
            await fetch('/api/games/loup-garou/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: gameRoom._id, field: 'status', value: 'finished' })
            });
        }
        setGameRoom(null);
        // We keep local 'players' intact so the MJ doesn't have to re-select everyone!
        setGameState(mode === 'online' ? "setup-online" : "setup-presence");
    }
  };

  const filteredMembers = availableMembers.filter(m => 
    m.name.toLowerCase().includes(searchMember.toLowerCase()) || 
    m.email.toLowerCase().includes(searchMember.toLowerCase())
  );

  // --- Sub-Views ---

  if (gameState === "forbidden") {
    return (
      <div className={styles.loupGarouWrapper}>
        <div className={styles.container}>
          <div className={styles.setupCard}>
            <h2 style={{color: '#ef4444', fontSize: '2rem', marginBottom: '20px'}}>Accès Refusé</h2>
            <p style={{marginBottom: '30px', opacity: 0.8}}>{error || "Vous n'avez pas les autorisations nécessaires pour accéder à ce jeu."}</p>
            <button className={styles.btn} onClick={() => window.location.href = '/dashboard'}>Retour au Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "mode-selection") {
    const isPresenceAllowed = !gamesConfig || gamesConfig.loupGarou.modes === 'both' || gamesConfig.loupGarou.modes === 'presence';
    const isOnlineAllowed = !gamesConfig || gamesConfig.loupGarou.modes === 'both' || gamesConfig.loupGarou.modes === 'online';

    return (
      <div className={styles.loupGarouWrapper}>
        <div className={styles.container}>
          <div className={styles.topBar}>
            <div className={styles.gameLogo}>Loup-Garou <span style={{fontSize: '0.8rem', opacity: 0.7}}>V1.0</span></div>
            <button className={styles.btn} onClick={() => { if(confirm(t('quit') + " ?")) window.location.href='/games' }}>{t('quit') || 'Quitter'}</button>
          </div>
          <div className={styles.setupCard}>
            <h2>Configurez votre aventure</h2>
            {error && <div style={{color: '#ff4444', marginBottom: '20px', background: 'rgba(255, 68, 68, 0.1)', padding: '10px', borderRadius: '8px'}}>{error}</div>}
            <div className={styles.modeSelection}>
              {isPresenceAllowed && (
                <button className={`${styles.modeBtn} ${styles.presence}`} onClick={() => handleModeChoice("presence")}>
                    <div className={styles.modeIcon}><Users size={40} /></div>
                    <div>
                        <h3>Mode Présentiel</h3>
                        <p>Un seul appareil, on se le passe.</p>
                    </div>
                </button>
              )}
              {isOnlineAllowed && (
                <button className={`${styles.modeBtn} ${styles.online}`} onClick={() => handleModeChoice("online")}>
                    <div className={styles.modeIcon}><Monitor size={40} /></div>
                    <div>
                        <h3>Mode En Ligne</h3>
                        <p>Chacun sur son propre appareil.</p>
                    </div>
                </button>
              )}
            </div>
            {!user && isOnlineAllowed && (
                <p style={{marginTop: '30px', opacity: 0.6, fontSize: '0.9rem'}}>
                    <Lock size={14} inline="true" /> Connectez-vous pour créer une partie en ligne.
                </p>
            )}
            
            {user && (
                <div style={{marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                    <h3 style={{fontSize: '1rem', marginBottom: '15px'}}>Rejoindre une partie existante</h3>
                    <form onSubmit={handleJoinByCode} style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                        <input 
                            className={styles.input} 
                            style={{margin: 0, maxWidth: '200px', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase'}} 
                            placeholder="CODE..."
                            value={joinRoomCode}
                            onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                        />
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading || !joinRoomCode.trim()}>
                            {loading ? "..." : "Rejoindre"}
                        </button>
                    </form>
                </div>
            )}

            {!isPresenceAllowed && !isOnlineAllowed && (
                <p style={{marginTop: '30px', color: '#ef4444', fontWeight: 'bold'}}>
                    Ce jeu est actuellement désactivé par l'administration.
                </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "setup-presence" || gameState === "setup-online") {
    return (
      <div className={styles.loupGarouWrapper}>
        <div className={styles.container}>
          <div className={styles.topBar}>
            <button className={styles.btn} onClick={() => setGameState("mode-selection")}>Retour</button>
            <div className={styles.gameLogo}>Configuration</div>
            <button className={styles.btn} onClick={() => { if(confirm(t('quit') + " ?")) window.location.href='/games' }}>{t('quit') || 'Quitter'}</button>
          </div>

          {user?.role === 'admin' && (
              <div style={{background: 'rgba(239, 68, 68, 0.2)', padding: '10px 20px', borderRadius: '8px', border: '1px solid #ef4444', textAlign: 'center', marginBottom: '20px'}}>
                  <span style={{color: '#ef4444', fontWeight: 'bold', marginRight: '15px'}}>Outil Admin: Déblocage d'Urgence</span>
                  <button className={`${styles.btnSmall}`} style={{background: '#ef4444'}} onClick={async () => {
                      if(confirm("ATTENTION: Ceci fermera TOUTES les parties de Loup-Garou en cours sur le serveur pour tous les utilisateurs. Continuer?")) {
                          const res = await fetch('/api/games/loup-garou/action', {
                              method: 'POST',
                              headers: {'Content-Type': 'application/json'},
                              body: JSON.stringify({ roomId: 'FORCE_CLEAN' })
                          });
                          const data = await res.json();
                          if(data.success) {
                              alert("Toutes les parties ont été clôturées ! (" + data.count + " nettoyées). Vous êtes débloqué.");
                              window.location.reload();
                          }
                      }
                  }}>HARD RESET SERVEUR</button>
              </div>
          )}
          
          {user && mode === 'online' && (
                <form onSubmit={handleJoinByCode} style={{padding: '15px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', border: '1px solid rgba(59, 130, 246, 0.4)', flexWrap: 'wrap', justifyContent: 'center'}}>
                    <strong style={{color: '#60a5fa', margin: 0}}>Avez-vous un code d'invitation ?</strong>
                    <input 
                        className={styles.input} 
                        style={{margin: 0, width: '150px', letterSpacing: '2px', textTransform: 'uppercase'}} 
                        placeholder="CODE..."
                        value={joinRoomCode}
                        onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                        maxLength={6}
                    />
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading || !joinRoomCode.trim()} style={{margin: 0, padding: '10px 20px', fontSize: '0.9rem'}}>
                        {loading ? "..." : "Rejoindre la salle"}
                    </button>
                </form>
          )}

          <div className={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}} style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
            
            {/* Left Column: Player Management */}
            <div className={styles.setupCard} style={{flex: 1, minWidth: '350px', textAlign: 'left', padding: '30px'}}>
              <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Users /> Joueurs ({players.length})</h3>
              
              {gameState === "setup-presence" ? (
                <form onSubmit={addManualPlayer} style={{marginTop: '20px'}}>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <input name="playerName" className={styles.input} placeholder="Nom du joueur..." />
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{height: '52px'}}><UserPlus size={20} /></button>
                  </div>
                </form>
              ) : (
                <div style={{marginTop: '20px'}}>
                    <div style={{position: 'relative'}}>
                        <input className={styles.input} placeholder="Rechercher un membre..." value={searchMember} onChange={e => setSearchMember(e.target.value)} />
                        <Search style={{position: 'absolute', right: '15px', top: '15px', opacity: 0.5}} />
                    </div>
                    <div className={styles.membersList} style={{maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px'}}>
                        {loading && <div>Chargement...</div>}
                        {filteredMembers.map(m => (
                            <div key={m._id} className={styles.memberItem} onClick={() => addMemberPlayer(m)}>
                                {m.name} <span style={{fontSize: '0.7rem', opacity: 0.5}}>({m.role})</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              <div style={{marginTop: '20px', maxHeight: '300px', overflowY: 'auto'}}>
                {players.map(p => (
                  <div key={p.id || p.userId} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px'}}>
                    <span>{p.name}</span>
                    <Trash2 size={16} style={{color: '#ff4444', cursor: 'pointer'}} onClick={() => removePlayer(p.id || p.userId)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Role Pool */}
            <div className={styles.setupCard} style={{flex: 1, minWidth: '350px', textAlign: 'left', padding: '30px'}}>
              <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Shuffle /> Deck de cartes ({rolePool.length})</h3>
              
              <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '20px 0'}}>
                <span style={{fontSize: '0.8rem', opacity: 0.7}}>Rôles rapides:</span>
                <button className={styles.btnSmall} onClick={() => addRoleToPool(ROLES.find(r => r.id === 'loup-garou'))}>+ Loup</button>
                <button className={styles.btnSmall} onClick={() => addRoleToPool(ROLES.find(r => r.id === 'simple-villageois'))}>+ Villageois</button>
                <button className={styles.btnSmall} style={{borderColor: '#ef4444', color: '#ef4444'}} onClick={() => setRolePool([])}>Vider</button>
                <button className={styles.btnSmall} style={{borderColor: '#60a5fa', color: '#60a5fa'}} onClick={() => setShowCustomRoleForm(true)}>+ Ajouter Rôle Perso</button>
                
                <select 
                    className={styles.btnSmall} 
                    style={{background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)'}}
                    onChange={(e) => {
                        if(e.target.value) {
                            const found = [...ROLES, ...sessionCustomRoles].find(r => r.id === e.target.value);
                            if (found) addRoleToPool(found);
                            e.target.value = "";
                        }
                    }}
                >
                    <option value="">+ Choisir rôle...</option>
                    {[...ROLES, ...sessionCustomRoles].sort((a,b) => (a.name?.[language] || "").localeCompare(b.name?.[language] || "")).map(r => (
                        <option key={r.id} value={r.id}>{r.icon} {r.name?.[language] || r.name?.fr || r.id}</option>
                    ))}
                </select>
              </div>

              {/* Custom Role Modal */}
              {showCustomRoleForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className={styles.setupCard} style={{width: '100%', maxWidth: '600px', textAlign: 'left', padding: '30px', maxHeight: '90vh', overflowY: 'auto'}}>
                        <h3 style={{marginBottom: '20px', color: '#60a5fa'}}>Nouveau Rôle Personnalisé</h3>
                        
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
                            <div>
                                <label style={{fontSize: '0.8rem', opacity: 0.7}}>Nom (FR)</label>
                                <input className={styles.input} style={{marginBottom: 0}} value={customRoleData.name.fr} onChange={e => setCustomRoleData({...customRoleData, name: {...customRoleData.name, fr: e.target.value}})} />
                            </div>
                            <div>
                                <label style={{fontSize: '0.8rem', opacity: 0.7}}>Nom (EN)</label>
                                <input className={styles.input} style={{marginBottom: 0}} value={customRoleData.name.en} onChange={e => setCustomRoleData({...customRoleData, name: {...customRoleData.name, en: e.target.value}})} />
                            </div>
                            <div>
                                <label style={{fontSize: '0.8rem', opacity: 0.7}}>Nom (AR)</label>
                                <input className={styles.input} style={{marginBottom: 0, textAlign: 'right'}} value={customRoleData.name.ar} onChange={e => setCustomRoleData({...customRoleData, name: {...customRoleData.name, ar: e.target.value}})} />
                            </div>
                            <div>
                                <label style={{fontSize: '0.8rem', opacity: 0.7}}>Icône (Emoji)</label>
                                <input className={styles.input} style={{marginBottom: 0}} value={customRoleData.icon} onChange={e => setCustomRoleData({...customRoleData, icon: e.target.value})} />
                            </div>
                        </div>

                        <div style={{marginBottom: '15px'}}>
                            <label style={{fontSize: '0.8rem', opacity: 0.7}}>Description (FR)</label>
                            <textarea className={styles.input} style={{minHeight: '60px', marginBottom: 0}} value={customRoleData.description.fr} onChange={e => setCustomRoleData({...customRoleData, description: {...customRoleData.description, fr: e.target.value}})} />
                        </div>
                        <div style={{marginBottom: '15px'}}>
                            <label style={{fontSize: '0.8rem', opacity: 0.7}}>Description (EN)</label>
                            <textarea className={styles.input} style={{minHeight: '60px', marginBottom: 0}} value={customRoleData.description.en} onChange={e => setCustomRoleData({...customRoleData, description: {...customRoleData.description, en: e.target.value}})} />
                        </div>
                        <div style={{marginBottom: '15px'}}>
                            <label style={{fontSize: '0.8rem', opacity: 0.7}}>Description (AR)</label>
                            <textarea className={styles.input} style={{minHeight: '60px', marginBottom: 0, textAlign: 'right'}} value={customRoleData.description.ar} onChange={e => setCustomRoleData({...customRoleData, description: {...customRoleData.description, ar: e.target.value}})} />
                        </div>

                        <div style={{display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px'}}>
                                <input type="checkbox" checked={customRoleData.canHaveMultiple} onChange={e => setCustomRoleData({...customRoleData, canHaveMultiple: e.target.checked})} />
                                <span style={{fontSize: '0.9rem'}}>Rôle répétable</span>
                            </label>
                            <select className={styles.input} style={{marginBottom: 0, padding: '10px', flex: 1}} value={customRoleData.team} onChange={e => setCustomRoleData({...customRoleData, team: e.target.value})}>
                                <option value={TEAMS.VILLAGE}>Équipe Village</option>
                                <option value={TEAMS.WOLVES}>Équipe Loups</option>
                                <option value={TEAMS.SOLITARY}>Équipe Solitaire</option>
                            </select>
                        </div>

                        <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                            <button className={styles.btn} onClick={() => setShowCustomRoleForm(false)}>Annuler</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddCustomRole}>Ajouter au deck</button>
                        </div>
                    </div>
                </div>
              )}

              <div style={{maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {rolePool.map((r, idx) => (
                  <div key={r.poolId || idx} style={{display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '8px 15px', borderRadius: '8px', borderLeft: `4px solid ${r.team === TEAMS.WOLVES ? '#ef4444' : '#60a5fa'}`}}>
                    <span>{r.icon} {r.name?.[language] || r.name?.fr || r.id}</span>
                    <Trash2 size={14} style={{opacity: 0.5, cursor: 'pointer'}} onClick={() => removeRoleFromPool(r.poolId || r.id)} />
                  </div>
                ))}
              </div>

              {(() => {
                const MIN_PLAYERS = gamesConfig?.loupGarou?.minPlayers || 3;
                const isReady = players.length >= MIN_PLAYERS && players.length === rolePool.length;
                
                return (
                  <button 
                    onClick={startDistribution} 
                    className={`${styles.btn} ${styles.btnPrimary}`} 
                    style={{
                        width: '100%', 
                        marginTop: '30px', 
                        padding: '20px', 
                        fontSize: '1.2rem',
                        opacity: (loading || !isReady) ? 0.5 : 1,
                        cursor: (loading || !isReady) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading || !isReady}
                  >
                    {loading ? "Chargement..." : (players.length < MIN_PLAYERS ? `Min. ${MIN_PLAYERS} joueurs requis (${players.length}/${MIN_PLAYERS})` : "Démarrer la partie")} <ArrowRight />
                  </button>
                );
              })()}
              {error && <p style={{color: '#ff4444', marginTop: '10px', fontSize: '0.8rem'}}>{error}</p>}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (gameState === "distribution") {
    const currentPlayer = players[distributingIndex];
    return (
      <div className={styles.loupGarouWrapper}>
        <div className={styles.container} style={{textAlign: 'center'}}>
          <div style={{display: 'flex', justifyContent: 'flex-start', marginBottom: '20px'}}>
             <button className={styles.btnSmall} onClick={() => setGameState(mode === 'online' ? "setup-online" : "setup-presence")}>Annuler / Retour</button>
          </div>
          <h2 style={{fontSize: '2rem', marginBottom: '10px'}}>{currentPlayer.name}</h2>
          <p style={{marginBottom: '40px', opacity: 0.7}}>C'est ton tour, appuie pour découvrir ton secret.</p>

          <div className={`${styles.cardContainer} ${isRevealing ? styles.cardFlipped : ''} ${isTransitioning ? styles.cardTransitioning : ''}`} 
               onClick={() => !isTransitioning && setIsRevealing(!isRevealing)}>
              <div className={styles.cardInner}>
                  <div className={styles.cardFront}>
                      <div className={styles.cardPattern} />
                      <Users size={60} style={{opacity: 0.3}} />
                      <div style={{marginTop: '20px', fontWeight: 'bold'}}>TOUCHES D'ART</div>
                      <div style={{fontSize: '0.8rem', opacity: 0.5}}>{isTransitioning ? "Chargement..." : "Cliquez pour retourner"}</div>
                  </div>
                  <div className={styles.cardBack} style={{ backgroundColor: isTransitioning ? '#000' : '' }}>
                      {!isTransitioning && (
                        <>
                          <div className={styles.roleEmoji}>{currentPlayer.role.icon}</div>
                          <div className={styles.roleName}>{currentPlayer.role.name[language] || currentPlayer.role.name.fr}</div>
                          <div className={styles.roleDesc}>{currentPlayer.role.description[language] || currentPlayer.role.description.fr}</div>
                          <div style={{marginTop: 'auto', fontWeight: 'bold', color: currentPlayer.role.team === TEAMS.WOLVES ? '#ef4444' : '#3b82f6'}}>
                              {currentPlayer.role.team.toUpperCase()}
                          </div>
                        </>
                      )}
                  </div>
              </div>
          </div>

          {isRevealing && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{marginTop: '50px'}} onClick={nextReveal}>
                {distributingIndex === players.length - 1 ? "Terminer" : "Joueur Suivant"} <ChevronRight />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === "awaiting-mj") {
    return (
        <div className={styles.loupGarouWrapper}>
            <div className={styles.container} style={{textAlign: 'center'}}>
                <ShieldCheck size={80} style={{color: 'var(--primary)', marginBottom: '30px'}} />
                <h2 style={{fontSize: '2rem', marginBottom: '20px'}}>Distribution Terminée</h2>
                <p style={{fontSize: '1.2rem', opacity: 0.8, marginBottom: '40px'}}>
                    Tous les joueurs ont pris connaissance de leur rôle.<br/>
                    Veuillez maintenant <strong>rendre l'appareil au Maître du Jeu</strong>.
                </p>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setGameState("board")}>
                    Je suis le Maître du Jeu (Ouvrir le plateau)
                </button>
            </div>
        </div>
    );
  }

  if (gameState === "invited") {
    return (
        <div className={styles.loupGarouWrapper}>
            <div className={styles.container} style={{textAlign: 'center', marginTop: '10vh'}}>
                <div className={styles.setupCard} style={{maxWidth: '500px', margin: '0 auto', padding: '40px', background: 'rgba(30, 27, 75, 0.8)', border: '1px solid #60a5fa'}}>
                    <ShieldCheck size={60} style={{color: '#60a5fa', marginBottom: '20px'}} />
                    <h2 style={{fontSize: '2rem', marginBottom: '20px'}}>Invitation au Loup-Garou !</h2>
                    <p style={{marginBottom: '30px', opacity: 0.8, fontSize: '1.2rem', lineHeight: '1.5'}}>
                        Le Maître du Jeu vous attend dans une partie secrète.<br/>
                        Êtes-vous prêt à découvrir votre identité ?
                    </p>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} style={{width: '100%', fontSize: '1.2rem', padding: '15px'}} onClick={() => setGameState("board")}>
                        Participer à la partie
                    </button>
                    <button className={styles.btn} style={{width: '100%', marginTop: '15px'}} onClick={() => {
                        setGameRoom(null);
                        if (gamesConfig && gamesConfig.loupGarou.modes === 'presence') {
                            setGameState('setup-presence');
                        } else if (gamesConfig && gamesConfig.loupGarou.modes === 'online') {
                            setGameState('setup-online');
                        } else {
                            setGameState('mode-selection');
                        }
                    }}>Ignorer (Créer une nouvelle partie)</button>
                </div>
            </div>
        </div>
    );
  }

  if (gameState === "board") {
    if (mode === 'online' && !gameRoom) return <div className={styles.setupCard} style={{margin:'20px'}}>Chargement de la partie...</div>;

    const myRole = ROLES.find(r => r.id === myPlayer?.roleId);

    return (
      <div className={`${styles.loupGarouWrapper} ${styles.boardView}`}>
        <div className={styles.container}>

          {/* TOP BAR */}
          <div className={styles.topBar}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <div className={styles.gameLogo} style={{fontSize: '0.9rem', color:'#fff'}}>
                {isMaster ? '🎩 MK' : (isAlivePlayer ? '🐺 EN JEU' : '💀 ÉLIMINÉ')}
              </div>
              <div style={{background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', opacity:0.8}}>
                #{gameRoom?.roomCode}
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '8px'}}>
              {isMaster && (
                <>
                  <button className={styles.btnSmall} style={{background: 'rgba(59,130,246,0.2)', border:'1px solid #60a5fa', color:'#60a5fa'}} onClick={handleNewGameFromBoard}>🔄 Relancer</button>
                  <button className={styles.btnSmall} style={{background: 'rgba(239,68,68,0.2)', border:'1px solid #ef4444', color:'#ef4444'}} onClick={handleEndGame}>⏹ Fermer</button>
                </>
              )}
              <button className={styles.btnSmall} onClick={() => { if(confirm('Quitter ?')) window.location.href='/games'; }}>Quitter</button>
            </div>
          </div>

          <div className={styles.gameLayout} style={mode === 'presence' ? {gridTemplateColumns: '1fr'} : {}}>
            
            {/* LEFT SIDE: Dashboard (Independent Scroll) */}
            <div className={styles.dashboardColumn} style={{ display: (mode === 'online' && typeof window !== 'undefined' && window.innerWidth < 1025 && boardTab === 'chat') ? 'none' : 'flex' }}>
              {isMaster || mode === 'presence' ? (
                /* MJ Dashboard */
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  <div className={styles.setupCard} style={{textAlign: 'left', padding: '15px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom:'15px'}}>
                      <h3 style={{margin: 0, fontSize: '1.1rem'}}>🃏 Joueurs ({currentGamePlayers.filter(p=>p.isAlive).length} en vie)</h3>
                      {mode === 'online' && (
                        <div style={{display: 'flex', gap: '8px'}}>
                          {gameRoom?.voteState?.isActive ? (
                            <button className={styles.btnSmall} style={{background: '#ef4444'}} onClick={closeVote}>Clore le vote</button>
                          ) : (
                            <button className={styles.btnSmall} style={{background: 'rgba(251,191,36,0.3)', border:'1px solid #fbbf24', color:'#fbbf24'}} onClick={startVote}>Lancer vote</button>
                          )}
                        </div>
                      )}
                    </div>

                    {mode === 'online' && gameRoom?.voteState?.isActive && (
                      <div style={{background:'rgba(251,191,36,0.08)', padding:'10px', borderRadius:'10px', fontSize:'0.8rem', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.15)', marginBottom:'15px'}}>
                        ⚖️ {gameRoom.voteState.title || 'Vote en cours'} : <strong>{gameRoom.voteState.votes?.length||0} voix</strong>
                      </div>
                    )}

                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px'}}>
                      {currentGamePlayers.map((p, idx) => {
                        const role = mode === 'online' ? ROLES.find(r => r.id === p.roleId) : p.role;
                        const isDead = !p.isAlive;
                        const voteCount = mode === 'online' ? (gameRoom?.voteState?.votes?.filter(v => v.targetId === p.userId?.toString()).length || 0) : 0;
                        return (
                          <div key={idx} className={`${styles.mjCard} ${p.isRevealed ? styles.mjCardFlipped : ''}`} style={{opacity: isDead ? 0.4 : 1, height:'170px'}} onClick={() => {
                            if (p.isRevealed || isDead) return;
                            if (mode === 'online') {
                                fetch('/api/games/loup-garou/action', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({roomId: gameRoom._id, playerIndex: idx, field:'isRevealed', value: true}) });
                                setGameRoom(prev => { const u = JSON.parse(JSON.stringify(prev)); if (u.players?.[idx]) u.players[idx].isRevealed = true; return u; });
                                setTimeout(() => {
                                  fetch('/api/games/loup-garou/action', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({roomId: gameRoom._id, playerIndex: idx, field:'isRevealed', value: false}) });
                                  setGameRoom(prev => { const u = JSON.parse(JSON.stringify(prev)); if (u.players?.[idx]) u.players[idx].isRevealed = false; return u; });
                                }, 4000);
                            } else {
                                setPlayers(prev => { const u = [...prev]; u[idx].isRevealed = true; return u; });
                                setTimeout(() => setPlayers(prev => { const u = [...prev]; u[idx].isRevealed = false; return u; }), 4000);
                            }
                          }}>
                            <div className={styles.mjCardInner}>
                              <div className={styles.mjCardFront} style={{padding:'8px', display:'flex', flexDirection:'column'}}>
                                {isDead && <div className={styles.deadOverlay} style={{fontSize:'1.1rem'}}>💀 MORT</div>}
                                <div className={styles.mjCardName} style={{fontSize:'0.85rem'}}>{p.name}</div>
                                <div className={styles.mjCardTeam} style={{color: role?.team===TEAMS.WOLVES?'#ef4444':'#60a5fa', fontSize:'0.55rem'}}>
                                  {role?.team?.toUpperCase()}
                                </div>
                                {voteCount > 0 && <div style={{fontSize:'0.6rem', marginTop:'3px', color:'#fbbf24', fontWeight:700}}>⚖️ {voteCount} voix</div>}
                                <div style={{marginTop: 'auto', display:'flex', gap:'3px'}} onClick={e => e.stopPropagation()}>
                                  <button className={styles.btnSmall} style={{flex:1, background: isDead ? '#22c55e' : '#ef4444', padding: '4px', fontSize: '0.6rem'}}
                                    onClick={e => {
                                      e.stopPropagation();
                                      const newVal = !p.isAlive;
                                      if (mode === 'online') {
                                        fetch('/api/games/loup-garou/action', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({roomId: gameRoom._id, playerIndex: idx, field:'isAlive', value: newVal}) });
                                        setGameRoom(prev => { const u = JSON.parse(JSON.stringify(prev)); if (u.players?.[idx]) u.players[idx].isAlive = newVal; return u; });
                                      } else {
                                        setPlayers(prev => { const u = [...prev]; u[idx].isAlive = newVal; return u; });
                                      }
                                    }}>
                                    {isDead ? 'Res' : 'Mort'}
                                  </button>
                                </div>
                              </div>
                              <div className={styles.mjCardBack}>
                                <div style={{fontSize: '1.4rem'}}>{role?.icon}</div>
                                <div style={{fontWeight: 'bold', fontSize: '0.7rem'}}>{role?.name?.[language]||role?.name?.fr}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Player Dashboard (Online only) */
                <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <div className={styles.setupCard} style={{textAlign: 'center', padding: '15px'}}>
                    {myPlayer ? (
                      <>
                        <div style={{fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px'}}>{myPlayer.name}</div>
                        <div className={`${styles.cardContainer} ${styles.cardFlipped}`} style={{height: '220px', width: '150px', margin: '0 auto 10px'}}>
                          <div className={styles.cardInner}>
                            <div className={styles.cardBack} style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', padding:'15px', border:'2px solid #3b82f6'}}>
                              <div style={{fontSize: '3rem'}}>{myRole?.icon}</div>
                              <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{myRole?.name?.[language] || myRole?.name?.fr}</div>
                              <div style={{fontSize: '0.75rem', opacity: 0.8, lineHeight: '1.3', color:'#444'}}>{myRole?.description?.[language] || myRole?.description?.fr}</div>
                              <div style={{fontWeight: 'bold', color: myRole?.team === TEAMS.WOLVES ? '#ef4444' : '#3b82f6', fontSize: '0.8rem', marginTop:'auto'}}>{myRole?.team?.toUpperCase()}</div>
                            </div>
                          </div>
                        </div>
                        {!isAlivePlayer && <div style={{background:'rgba(239,68,68,0.15)', padding:'8px', borderRadius:'10px', color:'#ef4444', fontWeight:'bold', border:'1px solid #ef4444', fontSize:'0.9rem'}}>💀 ÉLIMINÉ</div>}
                      </>
                    ) : <div style={{opacity:0.6, padding:'40px'}}>En attente de votre rôle...</div>}
                  </div>

                  {/* VOTE TOOLS for Players */}
                  {gameRoom?.voteState?.isActive && (
                    <div className={styles.setupCard} style={{textAlign: 'left', padding: '15px', background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)'}}>
                       <div style={{fontWeight: 'bold', color: '#fbbf24', marginBottom: '12px', fontSize:'0.9rem'}}>⚖️ {gameRoom.voteState.title || 'Vote en cours'}</div>
                       {isAlivePlayer ? (
                         <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px'}}>
                           {currentGamePlayers.filter(p => p.isAlive && p.userId?.toString() !== (user?.userId||user?._id)?.toString()).map((p, i) => {
                             const myVote = gameRoom.voteState.votes?.find(v => v.voterId === (user?.userId||user?._id)?.toString());
                             const voted = myVote?.targetId === p.userId?.toString();
                             return (
                               <button key={i} onClick={() => submitVote(p.userId?.toString())}
                                 style={{padding:'10px', borderRadius:'10px', border:`1px solid ${voted?'#fbbf24':'rgba(255,255,255,0.05)'}`, background:voted?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.03)', cursor:'pointer', color:'white', textAlign:'center', fontSize:'0.8rem', transition:'all 0.2s'}}>
                                 {voted ? '✅ ' : ''}{p.name}
                               </button>
                             );
                           })}
                         </div>
                       ) : <div style={{opacity:0.5, fontSize:'0.8rem', textAlign:'center'}}>Les morts ne votent pas.</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Chat (Independent Scroll) - Only in Online mode */}
            {mode === 'online' && (
              <div className={styles.chatColumn} style={{ display: (typeof window !== 'undefined' && window.innerWidth < 1025 && boardTab === 'game') ? 'none' : 'flex' }}>
                <PlayerChatPanel
                  generalChat={generalChat}
                  myPrivateMessages={myPrivateMessages}
                  isAlive={isAlivePlayer || isMaster}
                  sendChat={sendChat}
                  isMaster={isMaster}
                  myId={(user?.userId||user?._id)?.toString()}
                />
                
                {isMaster && (
                  <button className={styles.btnSmall} style={{width:'100%', padding:'10px', background:'rgba(59,130,246,0.05)', color:'#60a5fa', border:'1px dashed rgba(96,165,250,0.3)', borderRadius:'10px', marginTop:'5px'}} 
                    onClick={async () => {
                      const res = await fetch('/api/games/loup-garou/invite', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({roomId:gameRoom._id}) });
                      const d = await res.json();
                      alert(d.success ? '🔔 Invitation renvoyée' : 'Erreur');
                    }}>
                    Relancer les notifications
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Mobile Bottom Navigation - Only in Online mode */}
          {mode === 'online' && (
            <div className="mobile-nav" style={{display:'none', padding:'8px 15px', background:'rgba(15,23,42,0.9)', backdropFilter:'blur(10px)', borderTop:'1px solid rgba(255,255,255,0.1)', justifyContent:'space-around'}}>
                <button onClick={() => setBoardTab('game')} style={{flex:1, padding:'10px', border:'none', background:'none', color:boardTab==='game'?'#6366f1':'#94a3b8', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', fontSize:'0.7rem'}}>
                  <div style={{fontSize:'1.2rem'}}>🎮</div> JEU
                </button>
                <button onClick={() => setBoardTab('chat')} style={{flex:1, padding:'10px', border:'none', background:'none', color:boardTab==='chat'?'#6366f1':'#94a3b8', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', fontSize:'0.7rem'}}>
                  <div style={{fontSize:'1.2rem'}}>💬</div> CHAT
                </button>
            </div>
          )}

          <style jsx>{`
             @media (max-width: 1024px) {
                .mobile-nav { display: ${mode === 'online' ? 'flex' : 'none'} !important; }
             }
             @media (min-width: 1025px) {
                .${styles.dashboardColumn} { display: flex !important; }
                .${styles.chatColumn} { display: ${mode === 'online' ? 'flex' : 'none'} !important; }
             }
          `}</style>

        </div>
      </div>
    );
  }

  return null;
}

