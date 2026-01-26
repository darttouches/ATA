"use client";

// Force recompile

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, CheckCircle2, Palette, Smile, Users, Target, Heart, Zap, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutManagement() {
    const { t } = useLanguage();
    const [sections, setSections] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'general',
        icon: '',
        images: [],
        imageLayout: 'bottom',
        buttonText: '',
        buttonLink: '',
        active: true,
        order: 0
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/about');
        if (res.ok) {
            const data = await res.json();
            setSections(data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch('/api/admin/about', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
        });
        if (res.ok) {
            setShowModal(false);
            setEditId(null);
            setFormData({ title: '', content: '', type: 'general', icon: '', images: [], imageLayout: 'bottom', buttonText: '', buttonLink: '', active: true, order: 0 });
            fetchSections();
        }
    };

    const handleEdit = (section) => {
        setEditId(section._id);
        setFormData({
            title: section.title,
            content: section.content,
            type: section.type,
            icon: section.icon || '',
            images: section.images || [],
            imageLayout: section.imageLayout || 'bottom',
            buttonText: section.buttonText || '',
            buttonLink: section.buttonLink || '',
            active: section.active,
            order: section.order
        });
        setShowModal(true);
    };

    const deleteSection = async (id) => {
        if (confirm(t('confirmDeleteSection'))) {
            await fetch(`/api/admin/about?id=${id}`, { method: 'DELETE' });
            fetchSections();
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'objective': return t('objective');
            case 'domain': return t('domain');
            case 'value': return t('value');
            default: return t('general');
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [];

        for (const file of files) {
            const reader = new FileReader();
            await new Promise((resolve) => {
                reader.onloadend = async () => {
                    try {
                        const res = await fetch('/api/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileName: file.name, fileData: reader.result, folder: 'about' }),
                        });
                        const data = await res.json();
                        if (data.success) {
                            uploadedUrls.push(data.url);
                        }
                    } catch (error) {
                        console.error('Upload failed:', error);
                    }
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }

        setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        setUploading(false);
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> {t('loading')}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h1>{t('aboutManagementTitle')}</h1>
                <button className="btn btn-primary" onClick={() => {
                    setEditId(null);
                    setFormData({ title: '', content: '', type: 'general', icon: '', images: [], imageLayout: 'bottom', buttonText: '', buttonLink: '', active: true, order: 0 });
                    setShowModal(true);
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> {t('newSection')}
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>{t('title')}</th>
                            <th style={{ padding: '1rem' }}>{t('type')}</th>
                            <th style={{ padding: '1rem' }}>{t('content')}</th>
                            <th style={{ padding: '1rem' }}>{t('order')}</th>
                            <th style={{ padding: '1rem' }}>{t('status')}</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sections.map(section => (
                            <tr key={section._id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{section.title}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                    }}>
                                        {getTypeLabel(section.type)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {section.content}
                                </td>
                                <td style={{ padding: '1rem' }}>{section.order}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        color: section.active ? '#10b981' : '#f43f5e',
                                        background: section.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem'
                                    }}>
                                        {section.active ? t('active') : t('inactive')}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => handleEdit(section)} title={t('edit')} style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--primary)', background: 'none', cursor: 'pointer' }}><Edit2 size={16} color="var(--primary)" /></button>
                                        <button onClick={() => deleteSection(section._id)} title={t('delete')} style={{ padding: '5px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'none', cursor: 'pointer' }}><Trash2 size={16} color="#f43f5e" /></button>
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
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>{editId ? t('editSection') : t('newSection')}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('title')}</label>
                                <input className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('type')}</label>
                                    <select className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: '#11224E', color: 'white' }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="general">{t('general')}</option>
                                        <option value="objective">{t('objective')}</option>
                                        <option value="domain">{t('domain')}</option>
                                        <option value="value">{t('value')}</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('icon')} (Lucide Name)</label>
                                    <input className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }} value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="ex: Heart, Zap..." />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('content')}</label>
                                <textarea className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', minHeight: '100px' }} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>{t('images')}</label>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                                    {formData.images.map((img, index) => (
                                        <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                            <img src={img} alt={`Upload ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--card-border)' }} />
                                            <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f43f5e', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="card" style={{ width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed var(--primary)', background: 'rgba(17, 34, 78, 0.3)' }}>
                                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                        <span style={{ fontSize: '0.6rem', marginTop: '5px' }}>{t('add')}</span>
                                        <input type="file" hidden multiple onChange={handleFileUpload} accept="image/*" />
                                    </label>
                                </div>

                                {formData.images.length > 0 && (
                                    <div>
                                        <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>{t('imageLayout')}</label>
                                        <select className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: '#11224E', color: 'white' }} value={formData.imageLayout} onChange={e => setFormData({ ...formData, imageLayout: e.target.value })}>
                                            <option value="bottom">{t('layoutBottom')}</option>
                                            <option value="top">{t('layoutTop')}</option>
                                            <option value="left">{t('layoutLeft')}</option>
                                            <option value="right">{t('layoutRight')}</option>
                                            <option value="grid">{t('layoutGrid')}</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('buttonText')}</label>
                                    <input className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }} value={formData.buttonText} onChange={e => setFormData({ ...formData, buttonText: e.target.value })} placeholder={t('buttonTextPlaceholder')} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('buttonLink')}</label>
                                    <input className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }} value={formData.buttonLink} onChange={e => setFormData({ ...formData, buttonLink: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('order')}</label>
                                    <input type="number" className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)' }} value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '2rem' }}>
                                    <input type="checkbox" id="activeSection" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                    <label htmlFor="activeSection">{t('active')}</label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editId ? t('saveChanges') : t('create')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
