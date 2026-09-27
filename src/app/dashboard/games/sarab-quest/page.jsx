'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Plus, Clock, Target, ArrowRight, Trash2, Edit3 } from 'lucide-react';
import styles from './admin.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function PhygitalGamesDashboard() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGameId, setEditingGameId] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [location, setLocation] = useState('');
    const [mapTexture, setMapTexture] = useState('map_general');

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const res = await fetch('/api/games/sarab-quest/admin/games');
            const data = await res.json();
            if (data.success) {
                setGames(data.data);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGame = async (e) => {
        e.preventDefault();
        try {
            const url = editingGameId ? `/api/games/sarab-quest/admin/games/${editingGameId}` : '/api/games/sarab-quest/admin/games';
            const method = editingGameId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, startTime, location, mapTexture })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                fetchGames();
                setName(''); setDescription(''); setStartTime(''); setLocation(''); setMapTexture('map_general');
                setEditingGameId(null);
            } else {
                alert('Erreur: ' + data.error);
            }
        } catch (error) {
            console.error('Error saving game:', error);
        }
    };

    const handleEditClick = (game) => {
        setEditingGameId(game._id);
        setName(game.name || '');
        setDescription(game.description || '');
        if (game.startTime) {
            const d = new Date(game.startTime);
            const offset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16);
            setStartTime(localISOTime);
        } else {
            setStartTime('');
        }
        setLocation(game.location || '');
        setMapTexture(game.mapTexture || 'map_general');
        setShowModal(true);
    };

    const handleDeleteClick = async (gameId) => {
        if (!confirm(t('confirmDeleteMission') || 'Êtes-vous sûr de vouloir supprimer cette mission ?')) return;
        try {
            const res = await fetch(`/api/games/sarab-quest/admin/games/${gameId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchGames();
            } else {
                alert('Erreur: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    };

    return (
        <div className={styles.adminContainer} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <button onClick={() => router.back()} className={styles.btnSecondary} style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px', width: 'fit-content'}}>
                {language !== 'ar' && <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />}
                {t('mainDashboardBtn')}
                {language === 'ar' && <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />}
            </button>
            <div className={styles.title} style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
                <Activity color="#00f0ff" size={32} />
                <span style={{ flex: 1, textAlign: language === 'ar' ? 'right' : 'left' }}>{t('sarabQuestConsole')}</span>

                <button
                    onClick={() => {
                        setEditingGameId(null);
                        setName(''); setDescription(''); setStartTime(''); setLocation(''); setMapTexture('map_general');
                        setShowModal(true);
                    }}
                    className={styles.btnPrimary}
                    style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}
                >
                    <Plus size={18} /> {t('createNewMission')}
                </button>
            </div>

            {loading ? (
                <p style={{ color: '#00f0ff', fontFamily: 'Rajdhani', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('loadingData')}</p>
            ) : (
                <div className={styles.grid} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    {games.map(game => (
                        <div key={game._id} className={styles.gameItem} style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '15px', right: language === 'ar' ? 'auto' : '15px', left: language === 'ar' ? '15px' : 'auto', display: 'flex', gap: '5px', zIndex: 10 }}>
                                <button type="button" onClick={() => handleEditClick(game)} style={{background: 'transparent', border: 'none', color: '#ff9900', cursor: 'pointer', padding: '5px'}}><Edit3 size={16} /></button>
                                <button type="button" onClick={() => handleDeleteClick(game._id)} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px'}}><Trash2 size={16} /></button>
                            </div>
                            <h2 style={{ fontSize: '1.4rem', fontFamily: 'Rajdhani', color: '#fff', marginBottom: '10px' }}>{game.name}</h2>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <Clock size={14} color="#a67c52" />
                                <span style={{ direction: 'ltr' }}>{new Date(game.startTime).toLocaleString()}</span>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <span className={styles.badge} style={{
                                    background: game.status === 'active' ? 'rgba(0, 229, 153, 0.2)' :
                                        game.status === 'completed' ? 'rgba(255,255,255,0.1)' : 'rgba(255, 153, 0, 0.2)',
                                    color: game.status === 'active' ? '#00e599' :
                                        game.status === 'completed' ? '#94a3b8' : '#ff9900',
                                    border: `1px solid ${game.status === 'active' ? '#00e599' : game.status === 'completed' ? '#94a3b8' : '#ff9900'}`
                                }}>
                                    {game.status === 'active' ? t('activeStatus') : game.status === 'completed' ? t('completedStatus') : t('draftStatus')}
                                </span>
                            </div>

                            <Link href={`/dashboard/games/sarab-quest/${game._id}`} className={styles.btnSecondary} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                                {t('openDashboardPanel')} {language !== 'ar' ? <ArrowRight size={14} /> : <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />}
                            </Link>
                        </div>
                    ))}
                    {games.length === 0 && <p style={{ color: '#a67c52', gridColumn: '1/-1', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('noActiveMissions')}</p>}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, direction: language === 'ar' ? 'rtl' : 'ltr', padding: '15px' }}>
                    <div className={styles.card} style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 className={styles.cardHeader}>{editingGameId ? (t('editMissionBtn') || 'Modifier la mission') : t('setupNewMission')}</h2>
                        <form onSubmit={handleSaveGame}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', color: '#a67c52', marginBottom: '5px', fontSize: '0.9rem', fontFamily: 'Orbitron' }}>{t('missionName')}</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={styles.input} style={{ textAlign: language === 'ar' ? 'right' : 'left' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', color: '#a67c52', marginBottom: '5px', fontSize: '0.9rem', fontFamily: 'Orbitron' }}>{t('startTime')}</label>
                                <input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} className={styles.input} style={{ direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: '#a67c52', marginBottom: '10px', fontSize: '0.9rem', fontFamily: 'Orbitron' }}>{t('defaultMapShape')}</label>

                                {/* Large Preview Box */}
                                <div style={{
                                    width: '100%',
                                    height: '180px',
                                    borderRadius: '8px',
                                    border: '2px solid #00f0ff',
                                    boxShadow: '0 0 15px rgba(0,240,255,0.2)',
                                    marginBottom: '10px',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <img
                                        src={`/images/maps_photos/${mapTexture}.jfif`}
                                        alt="Map Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute', top: '10px', right: language === 'ar' ? '10px' : 'auto', left: language === 'ar' ? 'auto' : '10px',
                                        background: 'rgba(0,0,0,0.7)', color: '#00f0ff',
                                        padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'Rajdhani'
                                    }}>
                                        {t('mapPreview')}
                                    </div>
                                </div>

                                {/* Thumbnails selector */}
                                <div className={styles.mapGrid}>
                                    {[
                                        { id: 'map_general', name: t('mapOptionGeneral'), img: '/images/maps_photos/map_general.jfif' },
                                        { id: 'map_desert', name: t('mapOptionDesert'), img: '/images/maps_photos/map_desert.jfif' },
                                        { id: 'map_foret', name: t('mapOptionForet'), img: '/images/maps_photos/map_foret.jfif' },
                                        { id: 'map_plage', name: t('mapOptionPlage'), img: '/images/maps_photos/map_plage.jfif' }
                                    ].map(mapOption => (
                                        <div
                                            key={mapOption.id}
                                            onClick={() => setMapTexture(mapOption.id)}
                                            style={{
                                                cursor: 'pointer',
                                                border: mapTexture === mapOption.id ? '2px solid #00f0ff' : '2px solid #1a222d',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                transition: 'all 0.2s',
                                                height: '60px',
                                                opacity: mapTexture === mapOption.id ? 1 : 0.6
                                            }}
                                        >
                                            <img src={mapOption.img} alt={mapOption.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                background: mapTexture === mapOption.id ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0,0,0,0.7)',
                                                color: mapTexture === mapOption.id ? '#000' : '#fff',
                                                fontSize: '0.7rem', fontWeight: 'bold',
                                                textAlign: 'center', padding: '2px', fontFamily: 'Rajdhani'
                                            }}>
                                                {mapOption.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', color: '#a67c52', marginBottom: '5px', fontSize: '0.9rem', fontFamily: 'Orbitron' }}>{t('descOrInstructions')}</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className={styles.input} style={{ minHeight: '80px', textAlign: language === 'ar' ? 'right' : 'left' }}></textarea>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.btnSecondary} style={{ flex: 1 }}>{t('cancelBtn')}</button>
                                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>{editingGameId ? (t('saveEditsBtn') || 'Sauvegarder') : t('createTourBtn')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
