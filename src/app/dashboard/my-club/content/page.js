"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Video, Image, Lightbulb, CheckCircle, Clock, XCircle, Upload, Edit2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ProgramEditor from '@/components/ProgramEditor';

export default function ChefContentManagement() {
    const { t } = useLanguage();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        type: 'event',
        description: '',
        mediaUrl: '',
        date: '',
        time: '',
        photos: [],
        videoUrl: '',
        link: '',
        program: {
            items: [],
            globalDuration: '',
            partsCount: ''
        }
    });

    useEffect(() => {
        fetchContents();
    }, []);

    const fetchContents = async () => {
        const res = await fetch('/api/chef/content');
        if (res.ok) {
            const data = await res.json();
            setContents(data);
        }
        setLoading(false);
    };

    const [uploading, setUploading] = useState(0);

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
                        body: JSON.stringify({
                            fileName: file.name,
                            fileData: reader.result,
                            folder: 'content'
                        }),
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

    const handleSubmit = async (e) => {
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
            const res = await fetch('/api/chef/content', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (res.ok) {
                setShowModal(false);
                setEditId(null);
                setFormData({ title: '', type: 'event', description: '', date: '', time: '', photos: [], videoUrl: '', link: '', mediaUrl: '' });
                fetchContents();
                alert(editId ? t('contentUpdated') : t('contentSubmitted'));
            } else {
                const err = await res.json();
                alert(t('error') + " : " + (err.error || t('serverError')));
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert(t('serverError'));
        }
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
            mediaUrl: item.mediaUrl || (photosArray.length > 0 ? photosArray[0] : ''),
            program: item.program || { items: [], globalDuration: '', partsCount: '' }
        });
        setShowModal(true);
    };

    const deleteContent = async (id) => {
        if (confirm(t('confirmDeleteAction'))) { // Reusing confirm delete action
            await fetch(`/api/chef/content?id=${id}`, { method: 'DELETE' });
            fetchContents();
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle size={16} color="#10b981" />;
            case 'rejected': return <XCircle size={16} color="#f43f5e" />;
            default: return <Clock size={16} color="#f59e0b" />;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'event': return <Calendar size={20} />;
            case 'video': return <Video size={20} />;
            case 'photo': return <Image size={20} />;
            case 'formation': return <Lightbulb size={20} />;
            default: return <Calendar size={20} />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved': return t('approved');
            case 'rejected': return t('rejected');
            default: return t('pending');
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'event': return t('event');
            case 'video': return t('videoYoutube');
            case 'photo': return t('photoGalleryLabel');
            case 'formation': return t('formation');
            case 'news': return t('announcement');
            default: return type;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1>{t('contentsEventsTitle')}</h1>
                <button className="btn btn-primary" onClick={() => {
                    setEditId(null);
                    setFormData({
                        title: '', type: 'event', description: '', date: '', time: '',
                        photos: [], videoUrl: '', link: '', mediaUrl: '',
                        program: { items: [], globalDuration: '', partsCount: '' }
                    });
                    setShowModal(true);
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> {t('add')}
                </button>
            </div>

            {loading ? (
                <p>{t('loading')}</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {contents.map(item => (
                        <div key={item._id} className="card" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {getTypeIcon(item.type)}
                                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6 }}>{getTypeLabel(item.type)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {getStatusIcon(item.status)}
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{getStatusLabel(item.status)}</span>
                                </div>
                            </div>

                            <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
                            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem', minHeight: '40px' }}>
                                {item.description?.substring(0, 80)}...
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <button
                                    onClick={() => handleEdit(item)}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                    title={t('edit')}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => deleteContent(item._id)}
                                    style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                                    title={t('delete')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {contents.length === 0 && <p style={{ opacity: 0.5 }}>{t('noContentPublished')}</p>}
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>{editId ? t('editContent') : t('newContent')}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('title')}</label>
                                <input
                                    className="card"
                                    style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }}
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('type')}</label>
                                <select
                                    className="card"
                                    style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="event" style={{ background: '#11224E', color: 'white' }}>{t('event')}</option>
                                    <option value="formation" style={{ background: '#11224E', color: 'white' }}>{t('formation')}</option>
                                    <option value="photo" style={{ background: '#11224E', color: 'white' }}>{t('photoGalleryLabel')}</option>
                                    <option value="video" style={{ background: '#11224E', color: 'white' }}>{t('videoYoutube')}</option>
                                    <option value="news" style={{ background: '#11224E', color: 'white' }}>{t('announcement')}</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('date')}</label>
                                    <input
                                        type="date" className="card"
                                        style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('time')}</label>
                                    <input
                                        type="time" className="card"
                                        style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('description')}</label>
                                <textarea
                                    className="card"
                                    style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', minHeight: '80px' }}
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
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
                                        background: 'rgba(17, 34, 78, 0.2)',
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
                                                    <XCircle size={14} />
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('videoUrl')}</label>
                                        <label className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.7rem', cursor: 'pointer' }}>
                                            <Upload size={12} /> {t('import')}
                                            <input type="file" hidden accept="video/*" onChange={e => handleFileUpload(e, 'video')} />
                                        </label>
                                    </div>
                                    <input
                                        className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                        value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '5px' }}>{t('externalLink')}</label>
                                    <input
                                        className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                        value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })}
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
                                    {uploading > 0 ? `${t('uploading')} (${uploading})...` : (editId ? t('update') : t('submitForValidation'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
