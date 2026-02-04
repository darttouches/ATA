"use client";

import { useState, useEffect } from 'react';
import { Plus, Check, X, GalleryHorizontal, Home, ShieldCheck, Trash2, Edit2, Upload, XCircle, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ProgramEditor from '@/components/ProgramEditor';

export default function AdminContentModeration() {
    const { t } = useLanguage();
    const [contents, setContents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        type: 'event',
        description: '',
        date: '',
        time: '',
        photos: [],
        videoUrl: '',
        link: '',
        status: 'approved',
        club: '',
        program: {
            items: [],
            globalDuration: '',
            partsCount: ''
        }
    });

    useEffect(() => {
        fetchContents();
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const res = await fetch('/api/admin/clubs');
            if (res.ok) {
                const data = await res.json();
                setClubs(data);
            } else {
                const errorData = await res.json();
                console.error('Failed to fetch clubs:', res.status, errorData);
            }
        } catch (error) {
            console.error('Error fetching clubs:', error);
        }
    };

    const fetchContents = async () => {
        const res = await fetch('/api/admin/content');
        if (res.ok) {
            const data = await res.json();
            setContents(data);
        }
        setLoading(false);
    };

    const updateStatus = async (id, status) => {
        const res = await fetch('/api/admin/content', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        if (res.ok) fetchContents();
    };

    const toggleFlag = async (id, field, currentValue) => {
        const res = await fetch('/api/admin/content', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, [field]: !currentValue }),
        });
        if (res.ok) fetchContents();
    };

    const handleEdit = (item) => {
        setEditId(item._id);
        const photosArray = Array.isArray(item.photos)
            ? item.photos
            : (typeof item.photos === 'string' ? item.photos.split(',').map(p => p.trim()).filter(p => p) : []);

        setFormData({
            title: item.title,
            type: item.type,
            description: item.description || '',
            date: item.date || '',
            time: item.time || '',
            photos: photosArray,
            videoUrl: item.videoUrl || '',
            link: item.link || '',
            status: item.status,
            club: item.club?._id || item.club || '',
            mediaUrl: item.mediaUrl || (photosArray.length > 0 ? photosArray[0] : ''),
            program: item.program || { items: [], globalDuration: '', partsCount: '' }
        });
        setShowModal(true);
    };

    const [uploading, setUploading] = useState(0);

    const handleSave = async (e) => {
        e.preventDefault();
        if (uploading > 0) return alert(t('waitUpload'));

        try {
            const dataToSend = {
                ...formData,
                id: editId,
                photos: Array.isArray(formData.photos) ? formData.photos.filter(p => p && p.length > 5) : [],
                mediaUrl: formData.mediaUrl || (formData.photos.length > 0 ? formData.photos[0] : ''),
                program: formData.program ? {
                    ...formData.program,
                    partsCount: formData.program.partsCount ? parseInt(formData.program.partsCount) : undefined,
                    items: formData.program.items || []
                } : undefined
            };

            const method = editId ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/content', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (res.ok) {
                setShowModal(false);
                fetchContents();
                alert(t('contentSavedSuccess'));
            } else {
                const err = await res.json();
                alert(t('error') + " : " + (err.error || t('serverError')));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert(t('serverConnectionError'));
        }
    };

    const handleFileUpload = async (e, mode) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(prev => prev + files.length);

        for (const file of files) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileName: file.name, fileData: reader.result, folder: 'content' }),
                    });
                    const data = await res.json();
                    if (data.success) {
                        setFormData(prev => {
                            if (mode === 'photos') {
                                return { ...prev, photos: [...prev.photos, data.url] };
                            } else {
                                return { ...prev, videoUrl: data.url };
                            }
                        });
                    }
                } catch (error) {
                    console.error('Upload failed:', error);
                    alert(t('uploadFailed') + " (" + file.name + ")");
                } finally {
                    setUploading(prev => Math.max(0, prev - 1));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (url) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter(p => p !== url)
        }));
    };

    const deleteContent = async (id) => {
        if (confirm(t('confirmDeleteContent'))) {
            await fetch(`/api/admin/content?id=${id}`, { method: 'DELETE' });
            fetchContents();
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'event': return t('event');
            case 'formation': return t('formation');
            case 'photo': return t('photoGalleryLabel');
            case 'video': return t('videoYoutube');
            case 'news': return t('announcement');
            default: return type;
        }
    };

    if (loading) return <p>{t('loading')}</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>{t('content Moderation')}</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditId(null);
                        setFormData({
                            title: '', type: 'event', description: '', date: '', time: '',
                            photos: [], videoUrl: '', link: '', status: 'approved', club: '',
                            program: { items: [], globalDuration: '', partsCount: '' }
                        });
                        setShowModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> {t('addEvent')}
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>{t('content')}</th>
                            <th style={{ padding: '1rem' }}>{t('clubChef')}</th>
                            <th style={{ padding: '1rem' }}>{t('status')}</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                            <th style={{ padding: '1rem' }}>{t('sharing')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contents.map(item => (
                            <tr key={item._id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{getTypeLabel(item.type)}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div>{item.club?.name}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.author?.name}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        background: item.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'rejected' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 149, 11, 0.1)',
                                        color: item.status === 'approved' ? '#10b981' : item.status === 'rejected' ? '#f43f5e' : '#f59e0b'
                                    }}>
                                        {item.status === 'approved' ? t('approved') : item.status === 'rejected' ? t('refused') : t('pending')}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => updateStatus(item._id, 'approved')} title={t('approveAction')} style={{ padding: '5px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'none', cursor: 'pointer' }}><Check size={16} color="#10b981" /></button>
                                        <button onClick={() => updateStatus(item._id, 'rejected')} title={t('refuseAction')} style={{ padding: '5px', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.2)', background: 'none', cursor: 'pointer' }}><X size={16} color="#f43f5e" /></button>
                                        <button onClick={() => handleEdit(item)} title={t('edit')} style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--primary)', background: 'none', cursor: 'pointer' }}><Edit2 size={16} color="var(--primary)" /></button>
                                        <button onClick={() => deleteContent(item._id)} title={t('delete')} style={{ padding: '5px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'none', cursor: 'pointer' }}><Trash2 size={16} color="#f43f5e" /></button>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => toggleFlag(item._id, 'onHome', item.onHome)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '4px',
                                                border: '1px solid var(--card-border)', background: item.onHome ? 'var(--primary)' : 'none', color: 'white', fontSize: '0.75rem', cursor: 'pointer'
                                            }}
                                        >
                                            <Home size={14} /> {t('home')}
                                        </button>
                                        <button
                                            onClick={() => toggleFlag(item._id, 'isBestOff', item.isBestOff)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '4px',
                                                border: '1px solid var(--card-border)', background: item.isBestOff ? 'var(--secondary)' : 'none', color: 'white', fontSize: '0.75rem', cursor: 'pointer'
                                            }}
                                        >
                                            <GalleryHorizontal size={14} /> {t('bestOff')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>{editId ? t('editContentTitle') : t('newContentTitle')}</h2>
                        <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('title')}</label>
                                <input className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('type')}</label>
                                    <select className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="event" style={{ background: '#11224E', color: 'white' }}>{t('event')}</option>
                                        <option value="formation" style={{ background: '#11224E', color: 'white' }}>{t('formation')}</option>
                                        <option value="photo" style={{ background: '#11224E', color: 'white' }}>{t('photoGalleryLabel')}</option>
                                        <option value="video" style={{ background: '#11224E', color: 'white' }}>{t('videoYoutube')}</option>
                                        <option value="news" style={{ background: '#11224E', color: 'white' }}>{t('announcement')}</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('associateClub')}</label>
                                    <select
                                        className="card"
                                        style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.club}
                                        onChange={e => setFormData({ ...formData, club: e.target.value })}
                                        required
                                    >
                                        <option value="" style={{ background: '#11224E', color: 'white' }}>{t('selectClub')}</option>
                                        {clubs.map(c => (
                                            <option key={c._id} value={c._id} style={{ background: '#11224E', color: 'white' }}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('date')}</label>
                                    <input type="date" className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('time')}</label>
                                    <input type="time" className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('status')}</label>
                                    <select className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="pending" style={{ background: '#11224E', color: 'white' }}>{t('pending')}</option>
                                        <option value="approved" style={{ background: '#11224E', color: 'white' }}>{t('approved')}</option>
                                        <option value="rejected" style={{ background: '#11224E', color: 'white' }}>{t('refused')}</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('description')}</label>
                                <textarea className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', minHeight: '80px' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('photosSelect')}</label>
                                    <label className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Upload size={14} /> {t('importPhotos')}
                                        <input type="file" hidden accept="image/*" multiple onChange={e => handleFileUpload(e, 'photos')} />
                                    </label>
                                </div>

                                <div style={{ marginBottom: '1.5rem', border: '1px solid var(--card-border)', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <label style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>{t('galleryPhotos')}</label>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{formData.photos.length} {t('imagesImported')}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {formData.photos.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 10px', fontSize: '0.7rem', color: '#f43f5e' }}
                                                    onClick={() => setFormData(prev => ({ ...prev, photos: [] }))}
                                                >
                                                    {t('clearAll')}
                                                </button>
                                            )}
                                            <label className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Upload size={16} /> {t('import')}
                                                <input type="file" hidden accept="image/*" multiple onChange={e => handleFileUpload(e, 'photos')} />
                                            </label>
                                        </div>
                                    </div>

                                    {formData.photos && formData.photos.length > 0 ? (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                            gap: '12px',
                                            padding: '10px',
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: '8px',
                                            border: '1px dotted rgba(255,255,255,0.1)',
                                            maxHeight: '220px',
                                            overflowY: 'auto'
                                        }}>
                                            {formData.photos.map((url, idx) => (
                                                <div key={idx} style={{ position: 'relative', height: '100px', borderRadius: '6px', overflow: 'hidden', border: idx === 0 ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)' }}>
                                                    <img src={url} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {idx === 0 && (
                                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '2px 0', fontWeight: 700 }}>
                                                            {t('cover')}
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(url)}
                                                        style={{
                                                            position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)',
                                                            border: 'none', color: 'white', borderRadius: '50%', width: '22px', height: '22px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = '#f43f5e'}
                                                        onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '8px', opacity: 0.4, fontSize: '0.9rem' }}>
                                            {t('noPhotoSelected')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('videoUrlYoutube')}</label>
                                    <input
                                        className="card"
                                        style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }}
                                        value={formData.videoUrl}
                                        onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('externalLinkRegistration')}</label>
                                    <input
                                        className="card"
                                        style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }}
                                        value={formData.link}
                                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {(formData.type === 'event' || formData.type === 'formation') && (
                                <ProgramEditor
                                    program={formData.program?.items || []}
                                    setProgram={(items) => setFormData({ ...formData, program: { ...formData.program, items } })}
                                    globalDuration={formData.program?.globalDuration || ''}
                                    setGlobalDuration={(val) => setFormData({ ...formData, program: { ...formData.program, globalDuration: val } })}
                                    partsCount={formData.program?.partsCount || ''}
                                    setPartsCount={(val) => setFormData({ ...formData, program: { ...formData.program, partsCount: val } })}
                                />
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, opacity: uploading > 0 ? 0.5 : 1 }}
                                    disabled={uploading > 0}
                                >
                                    {uploading > 0 ? `${t('uploading')} (${uploading})...` : (editId ? t('saveChanges') : t('createEvent'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
