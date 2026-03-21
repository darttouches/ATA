"use client";

import { useState, useEffect } from "react";
import styles from "./loup-garou.module.css";
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
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setGameRoom(data.data);
                    }
                }
            } catch(e) {}
        }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [gameState, mode, gameRoom?._id]);

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
                        window.location.href='/dashboard';
                    }}>Ignorer</button>
                </div>
            </div>
        </div>
    );
  }

  if (gameState === "board") {
    if (mode === 'online' && !gameRoom) return <div className={styles.setupCard}>Chargement de la partie...</div>;

    const isMaster = user && gameRoom?.creatorId === (user?.userId || user?._id);
    const myPlayer = mode === 'online' ? gameRoom?.players?.find(p => p.userId === (user?.userId || user?._id)) : null;
    const currentGamePlayers = (mode === 'online' ? (gameRoom?.players || []) : players);

    return (
      <div className={styles.loupGarouWrapper}>
        <div className={styles.container}>
            <div className={styles.topBar}>
                <div className={styles.gameLogo}>{isMaster || mode === 'presence' ? "Maître du Jeu" : "Ma Carte"}</div>
                <div style={{background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem'}}>
                    {mode === 'online' ? `ROOM: ${gameRoom?.roomCode}` : 'MODE PRÉSENTIEL'}
                </div>
            </div>

            {isMaster ? (
                /* Online Mode MJ Dashboard */
                <div className={styles.setupCard} style={{textAlign: 'left', padding: '30px'}}>
                    <h3>Gestion de la partie</h3>
                    <p style={{opacity: 0.7, marginBottom: '20px'}}>En tant que MJ, vous voyez tout. Cliquez sur une carte pour voir le rôle (4s).</p>
                    
                    <div className={styles.dashboardGrid} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px'}}>
                        {currentGamePlayers.map((p, idx) => {
                            const role = ROLES.find(r => r.id === p.roleId);
                            const isDead = !p.isAlive;
                            
                            return (
                                <div key={idx} className={`${styles.mjCard} ${p.isRevealed ? styles.mjCardFlipped : ''}`} onClick={() => {
                                    if (p.isRevealed) return;
                                    
                                    // Update Server if Online
                                    fetch('/api/games/loup-garou/action', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ roomId: gameRoom._id, playerIndex: idx, field: 'isRevealed', value: true })
                                    });

                                    setGameRoom(prev => {
                                        if (!prev) return prev;
                                        const updated = JSON.parse(JSON.stringify(prev));
                                        if (updated.players?.[idx]) updated.players[idx].isRevealed = true;
                                        return updated;
                                    });
                                    
                                    setTimeout(() => {
                                        // Update Server to hide
                                        fetch('/api/games/loup-garou/action', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ roomId: gameRoom._id, playerIndex: idx, field: 'isRevealed', value: false })
                                        });

                                        setGameRoom(prev => {
                                            if (!prev) return prev;
                                            const updated = JSON.parse(JSON.stringify(prev));
                                            if (updated.players?.[idx]) {
                                                updated.players[idx].isRevealed = false;
                                            }
                                            return updated;
                                        });
                                    }, 4000);
                                }}>
                                    <div className={styles.mjCardInner}>
                                        <div className={styles.mjCardFront} style={{ opacity: isDead ? 0.6 : 1 }}>
                                            {isDead && <div className={styles.deadOverlay}>MORT</div>}
                                            <div className={styles.mjCardName}>{p.name}</div>
                                            <div className={styles.mjCardTeam} style={{color: role?.team === TEAMS.WOLVES ? '#ef4444' : '#60a5fa'}}>
                                                {role?.team?.toUpperCase()}
                                            </div>
                                            <div style={{marginTop: 'auto', display: 'flex', gap: '5px'}} onClick={e => e.stopPropagation()}>
                                                <button 
                                                    className={styles.btnSmall}
                                                    style={{background: isDead ? '#22c55e' : '#ef4444', padding: '5px 10px', fontSize: '0.7rem'}}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newValue = !p.isAlive;
                                                        
                                                        // Update Server
                                                        fetch('/api/games/loup-garou/action', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ roomId: gameRoom._id, playerIndex: idx, field: 'isAlive', value: newValue })
                                                        });

                                                        setGameRoom(prev => {
                                                            if (!prev) return prev;
                                                            const updated = JSON.parse(JSON.stringify(prev));
                                                            if (updated.players?.[idx]) updated.players[idx].isAlive = newValue;
                                                            return updated;
                                                        });
                                                    }}
                                                >
                                                    {isDead ? "VIE" : "MORT"}
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.mjCardBack}>
                                            <div style={{fontSize: '2rem'}}>{role?.icon}</div>
                                            <div style={{fontWeight: 'bold', fontSize: '1rem'}}>{role?.name?.[language] || role?.name?.fr}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : mode === 'presence' ? (
                /* Presence Mode MJ Dashboard (Device is shared) */
                <div className={styles.setupCard} style={{textAlign: 'left', padding: '30px'}}>
                    <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}><ShieldCheck /> Tableau du Maître du Jeu</h3>
                    <p style={{opacity: 0.7, marginBottom: '20px'}}>Cliquez sur une carte pour voir le rôle temporairement (4s).</p>
                    
                    <div className={styles.dashboardGrid} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px'}}>
                        {players.map((p, idx) => {
                            const isDead = !p.isAlive;
                            return (
                                <div key={idx} className={`${styles.mjCard} ${p.isRevealed ? styles.mjCardFlipped : ''}`} onClick={() => {
                                    if (p.isRevealed) return;
                                    const newPlayers = [...players];
                                    newPlayers[idx].isRevealed = true;
                                    setPlayers(newPlayers);
                                    
                                    setTimeout(() => {
                                        setPlayers(prev => {
                                            const updated = [...prev];
                                            if (updated[idx]) updated[idx].isRevealed = false;
                                            return updated;
                                        });
                                    }, 4000);
                                }}>
                                    <div className={styles.mjCardInner}>
                                        <div className={styles.mjCardFront} style={{ opacity: isDead ? 0.6 : 1 }}>
                                            {isDead && <div className={styles.deadOverlay} style={{fontSize: '1rem'}}>MORT</div>}
                                            <div className={styles.mjCardName}>{p.name}</div>
                                            <div style={{marginTop: 'auto', display: 'flex', gap: '5px'}} onClick={e => e.stopPropagation()}>
                                                <button 
                                                    className={styles.btnSmall}
                                                    style={{background: isDead ? '#22c55e' : '#ef4444', padding: '2px 8px', fontSize: '0.6rem'}}
                                                    onClick={() => {
                                                        const newPlayers = [...players];
                                                        newPlayers[idx].isAlive = !newPlayers[idx].isAlive;
                                                        setPlayers(newPlayers);
                                                    }}
                                                >
                                                    {isDead ? "VIE" : "MORT"}
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.mjCardBack}>
                                            <div style={{fontSize: '2rem'}}>{p.role?.icon}</div>
                                            <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{p.role?.name?.[language] || p.role?.name?.fr}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : myPlayer ? (
                /* Online Mode Player View */
                <div style={{textAlign: 'center'}}>
                    <h2 style={{fontSize: '2rem', marginBottom: '30px'}}>{myPlayer.name}, Voici ton secret...</h2>
                    <div className={`${styles.cardContainer} ${styles.cardFlipped}`}>
                        <div className={styles.cardInner}>
                            <div className={styles.cardFront}>
                                <Users size={60} style={{opacity: 0.3}} />
                                <div style={{marginTop: '20px', fontWeight: 'bold'}}>TOUCHES D'ART</div>
                            </div>
                            <div className={styles.cardBack}>
                                <div className={styles.roleEmoji}>{ROLES.find(r => r.id === myPlayer.roleId)?.icon}</div>
                                <div className={styles.roleName}>
                                    {ROLES.find(r => r.id === myPlayer.roleId)?.name?.[language] || ROLES.find(r => r.id === myPlayer.roleId)?.name?.fr}
                                </div>
                                <div className={styles.roleDesc}>
                                    {ROLES.find(r => r.id === myPlayer.roleId)?.description?.[language] || ROLES.find(r => r.id === myPlayer.roleId)?.description?.fr}
                                </div>
                                <div style={{marginTop: 'auto', fontWeight: 'bold', color: ROLES.find(r => r.id === myPlayer.roleId)?.team === TEAMS.WOLVES ? '#ef4444' : '#3b82f6'}}>
                                    {ROLES.find(r => r.id === myPlayer.roleId)?.team?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <p style={{marginTop: '40px', opacity: 0.6, fontSize: '0.9rem'}}>Chaque joueur voit uniquement sa carte.</p>
                </div>
            ) : (
                <div className={styles.setupCard}>
                    <h3>En attente...</h3>
                    <p>Le Maître du Jeu n'a pas encore distribué les rôles ou vous n'êtes pas dans cette partie.</p>
                </div>
            )}

            <div style={{marginTop: '40px', display: 'flex', gap: '20px', justifyContent: 'center'}}>
                <button className={styles.btn} onClick={() => {
                    if (confirm(t('quit') + " ?")) {
                        window.location.href = '/games';
                    }
                }}>{t('quit') || 'Quitter'}</button>
                {isMaster && mode === 'online' && (
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={async () => {
                        try {
                            const res = await fetch('/api/games/loup-garou/invite', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ roomId: gameRoom._id })
                            });
                            const data = await res.json();
                            if (data.success) {
                                alert("🔔 " + data.message + (data.debug?.failures?.length > 0 ? "\n\nErreurs internes :\n" + JSON.stringify(data.debug.failures) : ""));
                            } else {
                                alert("Erreur : " + data.error);
                            }
                        } catch (err) {
                            alert("Erreur serveur.");
                        }
                    }}>Inviter les joueurs (Notifications)</button>
                )}
            </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}

