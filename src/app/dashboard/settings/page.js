"use client";

import { useState, useEffect, useCallback } from 'react';
import { Upload, Save, Check, Plus, Trash2, Link as LinkIcon, Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';

export default function AdminSettings() {
    const { t } = useLanguage();
    const [logo, setLogo] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Footer State
    const [footerData, setFooterData] = useState({
        description: '',
        address: '',
        email: '',
        phone: '',
        socials: [], // { platform: 'facebook', url: '' }
        quickLinks: [], // { text: '', url: '' }
        copyright: ''
    });

    // ATA Waves State
    const [ataWavesData, setAtaWavesData] = useState({
        isPublished: false,
        authorizedUsers: [],
        logo: '',
        description: ''
    });

    // Background Music State
    const [bgMusicData, setBgMusicData] = useState({
        playlist: [{ id: 'default', name: 'Musique Par Défaut', url: '/music/background.mp3' }],
        activeTrackId: 'default',
        volume: 0.5
    });

    const [allUsers, setAllUsers] = useState([]);

    const fetchSettings = useCallback(async () => {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
            const data = await res.json();
            if (data.logo) setLogo(data.logo);
            if (data.footer) setFooterData(data.footer);
            if (data.ataWaves) setAtaWavesData(data.ataWaves);
            if (data.bgMusic) setBgMusicData(data.bgMusic);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setAllUsers(data);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchSettings();
            await fetchUsers();
        };
        init();
    }, [fetchSettings, fetchUsers]);

    const handleFileUpload = async (e, type = 'logo') => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileData: reader.result,
                        folder: type === 'logo' ? 'logo' : (type === 'bg_music' ? 'music' : 'ata_waves')
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    if (type === 'logo') {
                        setLogo(data.url);
                    } else if (type === 'ata_waves_logo') {
                        setAtaWavesData({ ...ataWavesData, logo: data.url });
                    } else if (type === 'bg_music') {
                        const newTrackId = Date.now().toString();
                        setBgMusicData({
                            ...bgMusicData,
                            activeTrackId: newTrackId,
                            playlist: [...bgMusicData.playlist, {
                                id: newTrackId,
                                name: file.name,
                                url: data.url
                            }]
                        });
                    }
                } else {
                    alert(data.error || 'Erreur lors de l\'importation');
                    console.error('Upload error:', data);
                }
            } catch (error) {
                console.error('Upload request failed:', error);
                alert('Erreur technique lors de l\'importation');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                logoUrl: logo,
                footer: footerData,
                ataWaves: ataWavesData,
                bgMusic: bgMusicData
            }),
        });

        if (res.ok) {
            setSuccess(true);
            // Dispatch custom event to notify other components (like BackgroundMusic)
            window.dispatchEvent(new CustomEvent('settings-updated', { 
                detail: { logo, footer: footerData, ataWaves: ataWavesData, bgMusic: bgMusicData } 
            }));
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Paramètres de l'Association</h1>

            <div className="card">
                <h3>Logo de l'Association</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                    Ce logo s'affichera dans la barre de navigation sur toutes les pages.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2rem' }}>
                    <div style={{
                        width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px dashed var(--card-border)', overflow: 'hidden', position: 'relative'
                    }}>
                        {logo ? (
                            <Image
                                src={logo}
                                alt="Logo Preview"
                                fill
                                style={{ objectFit: 'contain', padding: '10px' }}
                            />
                        ) : (
                            <Upload size={32} style={{ opacity: 0.2 }} />
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', marginBottom: '10px', display: 'inline-flex' }}>
                            <Upload size={18} style={{ marginRight: '8px' }} /> {loading ? 'Chargement...' : 'Importation locale'}
                            <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={loading} />
                        </label>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                            Extensions admises : JPG, PNG, SVG. Taille max 2Mo.
                        </div>
                        {logo && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '5px', wordBreak: 'break-all' }}>Chemin : {logo}</div>}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    onClick={handleSave}
                    disabled={loading || !logo}
                >
                    {success ? <><Check size={18} /> {t('changesSaved')}</> : <><Save size={18} /> {t('saveAllChanges')}</>}
                </button>
            </div>

            {/* ATA Waves Management Section */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>ATA Waves</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                    Gérer la visibilité et l'accès à l'interface ATA Waves.
                </p>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={ataWavesData.isPublished}
                            onChange={(e) => setAtaWavesData({...ataWavesData, isPublished: e.target.checked})}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontWeight: 600 }}>Publier ATA Waves dans la barre de navigation</span>
                    </label>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Configuration de la page</h4>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Logo ATA Waves</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                    {ataWavesData.logo ? <Image src={ataWavesData.logo} alt="ATA Waves" fill style={{ objectFit: 'contain', padding: '5px' }} /> : <Upload opacity={0.3} />}
                                </div>
                                <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                                    {loading ? 'Chargement...' : 'Changer de Logo'}
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'ata_waves_logo')} disabled={loading} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description Générale</label>
                            <textarea
                                className="card"
                                style={{ width: '100%', minHeight: '80px', border: '1px solid var(--card-border)' }}
                                value={ataWavesData.description || ''}
                                onChange={e => setAtaWavesData({ ...ataWavesData, description: e.target.value })}
                                placeholder="Description de l'interface ATA Waves..."
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                            Utilisateurs autorisés à gérer ATA Waves
                        </label>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem' }}>
                            Sélectionnez les membres qui pourront ajouter, modifier ou supprimer le contenu de ATA Waves.
                        </p>
                        
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                            {allUsers.length > 0 ? allUsers.map(user => (
                                <label key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={ataWavesData.authorizedUsers.includes(user._id)}
                                        onChange={(e) => {
                                            const newUsers = e.target.checked 
                                                ? [...ataWavesData.authorizedUsers, user._id]
                                                : ataWavesData.authorizedUsers.filter(id => id !== user._id);
                                            setAtaWavesData({...ataWavesData, authorizedUsers: newUsers});
                                        }}
                                    />
                                    <span>{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}</span>
                                    {user.role === 'admin' && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--primary)', borderRadius: '4px', marginLeft: 'auto' }}>Admin</span>}
                                </label>
                            )) : (
                                <div style={{ opacity: 0.5, textAlign: 'center', padding: '10px' }}>Chargement des utilisateurs...</div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {success ? <><Check size={18} /> {t('changesSaved')}</> : <><Save size={18} /> {t('saveAllChanges')}</>}
                </button>
            </div>

            {/* Background Music Section */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>Musique de Fond</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                    Gérer la musique de fond globale du site. La musique sera en pause automatiquement lors de l'ouverture d'une émission ATA Waves.
                </p>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Volume par défaut</label>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.1" 
                            value={bgMusicData.volume} 
                            onChange={(e) => setBgMusicData({...bgMusicData, volume: parseFloat(e.target.value)})} 
                            style={{ width: '100%', accentColor: 'var(--primary)' }}
                        />
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, textAlign: 'right' }}>{Math.round(bgMusicData.volume * 100)}%</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Liste de Lecture</h4>
                            <label className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Upload size={14} /> {loading ? 'Chargement...' : 'Ajouter une musique'}
                                <input type="file" hidden accept="audio/*" onChange={(e) => handleFileUpload(e, 'bg_music')} disabled={loading} />
                            </label>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {bgMusicData.playlist.map(track => (
                                <div key={track.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '10px', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name="bgTrack"
                                            checked={bgMusicData.activeTrackId === track.id}
                                            onChange={() => setBgMusicData({...bgMusicData, activeTrackId: track.id})}
                                        />
                                        <span style={{ fontWeight: bgMusicData.activeTrackId === track.id ? 'bold' : 'normal', color: bgMusicData.activeTrackId === track.id ? 'var(--primary)' : 'inherit' }}>
                                            {track.name}
                                        </span>
                                    </label>
                                    {track.id !== 'default' && (
                                        <button 
                                            onClick={() => setBgMusicData({
                                                ...bgMusicData, 
                                                playlist: bgMusicData.playlist.filter(t => t.id !== track.id),
                                                activeTrackId: bgMusicData.activeTrackId === track.id ? 'default' : bgMusicData.activeTrackId
                                            })}
                                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '5px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {success ? <><Check size={18} /> {t('changesSaved')}</> : <><Save size={18} /> {t('saveAllChanges')}</>}
                </button>
            </div>

            {/* Footer Management Section */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>{t('footerManagement')}</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                    {t('footerManagementDesc')}
                </p>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('footerDescription')}</label>
                        <textarea
                            className="card"
                            style={{ width: '100%', minHeight: '80px', border: '1px solid var(--card-border)' }}
                            value={footerData.description}
                            onChange={e => setFooterData({ ...footerData, description: e.target.value })}
                            placeholder={t('footerDescriptionPlaceholder')}
                        />
                    </div>

                    {/* Contact Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('addressLocal')}</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.address}
                                onChange={e => setFooterData({ ...footerData, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> Email</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.email}
                                onChange={e => setFooterData({ ...footerData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('phone')}</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.phone}
                                onChange={e => setFooterData({ ...footerData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Copyright</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.copyright}
                                onChange={e => setFooterData({ ...footerData, copyright: e.target.value })}
                                placeholder="© 2024 Touches D'Art"
                            />
                        </div>
                    </div>

                    {/* Social Media */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('socialLinks')}</label>
                        {footerData.socials.map((social, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <select
                                    className="card"
                                    style={{ width: '150px', border: '1px solid var(--card-border)', background: '#11224E', color: 'white' }}
                                    value={social.platform}
                                    onChange={e => {
                                        const newSocials = [...footerData.socials];
                                        newSocials[index].platform = e.target.value;
                                        setFooterData({ ...footerData, socials: newSocials });
                                    }}
                                >
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="twitter">Twitter</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="youtube">YouTube</option>
                                </select>
                                <input
                                    className="card"
                                    style={{ flex: 1, border: '1px solid var(--card-border)' }}
                                    value={social.url}
                                    onChange={e => {
                                        const newSocials = [...footerData.socials];
                                        newSocials[index].url = e.target.value;
                                        setFooterData({ ...footerData, socials: newSocials });
                                    }}
                                    placeholder="URL..."
                                />
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        const newSocials = footerData.socials.filter((_, i) => i !== index);
                                        setFooterData({ ...footerData, socials: newSocials });
                                    }}
                                >
                                    <Trash2 size={16} color="#f43f5e" />
                                </button>
                            </div>
                        ))}
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                            onClick={() => setFooterData({ ...footerData, socials: [...footerData.socials, { platform: 'facebook', url: '' }] })}
                        >
                            <Plus size={14} style={{ marginRight: '5px' }} /> {t('add')}
                        </button>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('quickLinks')}</label>
                        {footerData.quickLinks.map((link, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    className="card"
                                    style={{ flex: 1, border: '1px solid var(--card-border)' }}
                                    value={link.text}
                                    onChange={e => {
                                        const newLinks = [...footerData.quickLinks];
                                        newLinks[index].text = e.target.value;
                                        setFooterData({ ...footerData, quickLinks: newLinks });
                                    }}
                                    placeholder={t('text')}
                                />
                                <input
                                    className="card"
                                    style={{ flex: 1, border: '1px solid var(--card-border)' }}
                                    value={link.url}
                                    onChange={e => {
                                        const newLinks = [...footerData.quickLinks];
                                        newLinks[index].url = e.target.value;
                                        setFooterData({ ...footerData, quickLinks: newLinks });
                                    }}
                                    placeholder="URL..."
                                />
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        const newLinks = footerData.quickLinks.filter((_, i) => i !== index);
                                        setFooterData({ ...footerData, quickLinks: newLinks });
                                    }}
                                >
                                    <Trash2 size={16} color="#f43f5e" />
                                </button>
                            </div>
                        ))}
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                            onClick={() => setFooterData({ ...footerData, quickLinks: [...footerData.quickLinks, { text: '', url: '' }] })}
                        >
                            <Plus size={14} style={{ marginRight: '5px' }} /> {t('add')}
                        </button>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '2rem' }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {success ? <><Check size={18} /> {t('changesSaved')}</> : <><Save size={18} /> {t('saveAllChanges')}</>}
                </button>
            </div>
        </div>
    );
}
