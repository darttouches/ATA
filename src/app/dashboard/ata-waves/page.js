"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, Upload, Save, X, Radio } from 'lucide-react';
import Image from 'next/image';

export default function AtaWavesManagement() {
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [currentEpisode, setCurrentEpisode] = useState({
        title: '',
        description: '',
        animator: '',
        coverImage: '',
        videoUrl: '',
        publishedAt: new Date().toISOString().slice(0, 10)
    });

    const fetchEpisodes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ata-waves-episodes');
            const data = await res.json();
            setEpisodes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEpisodes();
    }, [fetchEpisodes]);

    const handleOpenModal = (episode = null) => {
        if (episode) {
            setCurrentEpisode({
                ...episode,
                publishedAt: episode.publishedAt ? new Date(episode.publishedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
            });
        } else {
            setCurrentEpisode({
                title: '',
                description: '',
                animator: '',
                coverImage: '',
                videoUrl: '',
                publishedAt: new Date().toISOString().slice(0, 10)
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = { ...currentEpisode, publishedAt: new Date(currentEpisode.publishedAt) };
            const method = payload._id ? 'PUT' : 'POST';
            const url = payload._id ? `/api/ata-waves-episodes/${payload._id}` : '/api/ata-waves-episodes';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchEpisodes();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Save failed', error);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Voulez-vous vraiment supprimer cette émission ?")) {
            await fetch(`/api/ata-waves-episodes/${id}`, { method: 'DELETE' });
            fetchEpisodes();
        }
    };

    const handleCoverUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingCover(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: reader.result,
                    folder: 'ata_waves'
                }),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentEpisode({ ...currentEpisode, coverImage: data.url });
            }
            setUploadingCover(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1><Radio size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} /> Gestion ATA Waves</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Nouvelle émission
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>Chargement des émissions...</div>
            ) : episodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, border: '1px dashed var(--card-border)', borderRadius: '12px' }}>
                    Aucune émission pour le moment.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {episodes.map(ep => (
                        <div key={ep._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ height: '160px', borderRadius: '8px', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                {ep.coverImage ? (
                                    <Image src={ep.coverImage} alt={ep.title} fill style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.2 }}>
                                        <Radio size={48} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{ep.title}</h3>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '10px' }}>
                                    Par {ep.animator || 'Non spécifié'} • {new Date(ep.publishedAt).toLocaleDateString()}
                                </div>
                                <p style={{ fontSize: '0.85rem', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {ep.description}
                                </p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--card-border)' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleOpenModal(ep)}>
                                    <Edit2 size={16} /> Modifier
                                </button>
                                <button className="btn btn-secondary" style={{ color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }} onClick={() => handleDelete(ep._id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                        borderRadius: '12px', padding: '30px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>{currentEpisode._id ? 'Modifier l\'émission' : 'Nouvelle émission'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Couverture *</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                    <div style={{ position: 'relative', width: '120px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {currentEpisode.coverImage ? (
                                            <Image src={currentEpisode.coverImage} alt="Cover" fill style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <Upload size={24} style={{ opacity: 0.2 }} />
                                        )}
                                    </div>
                                    <div>
                                        <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                                            {uploadingCover ? 'Chargement...' : 'Choisir une image'}
                                            <input type="file" hidden accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Titre *</label>
                                <input
                                    type="text"
                                    className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                    value={currentEpisode.title}
                                    onChange={(e) => setCurrentEpisode({ ...currentEpisode, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Lien de la vidéo (Facebook, Insta, YouTube, TikTok) *</label>
                                <input
                                    type="url"
                                    className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                    value={currentEpisode.videoUrl}
                                    onChange={(e) => setCurrentEpisode({ ...currentEpisode, videoUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Animateur(s)</label>
                                <input
                                    type="text"
                                    className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                    value={currentEpisode.animator}
                                    onChange={(e) => setCurrentEpisode({ ...currentEpisode, animator: e.target.value })}
                                    placeholder="Séparés par des virgules..."
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Date de publication</label>
                                <input
                                    type="date"
                                    className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                    value={currentEpisode.publishedAt}
                                    onChange={(e) => setCurrentEpisode({ ...currentEpisode, publishedAt: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Description</label>
                                <textarea
                                    className="card"
                                    style={{ width: '100%', minHeight: '100px', border: '1px solid var(--card-border)' }}
                                    value={currentEpisode.description}
                                    onChange={(e) => setCurrentEpisode({ ...currentEpisode, description: e.target.value })}
                                />
                            </div>

                            <button 
                                className="btn btn-primary" 
                                style={{ width: '100%', marginTop: '10px' }}
                                onClick={handleSave}
                                disabled={!currentEpisode.title || !currentEpisode.videoUrl || !currentEpisode.coverImage || uploadingCover}
                            >
                                <Save size={18} style={{ marginRight: '8px' }} /> Enregistrer l&apos;émission
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
