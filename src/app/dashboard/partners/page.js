"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload, X, ExternalLink, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function PartnersManagement() {
    const { t } = useLanguage();
    const [partners, setPartners] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        logo: '',
        website: '',
        active: true,
        order: 0
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/partners');
        if (res.ok) {
            const data = await res.json();
            setPartners(data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch('/api/admin/partners', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
        });
        if (res.ok) {
            setShowModal(false);
            setEditId(null);
            setFormData({ name: '', logo: '', website: '', active: true, order: 0 });
            fetchPartners();
        }
    };

    const handleEdit = (partner) => {
        setEditId(partner._id);
        setFormData({
            name: partner.name || '',
            logo: partner.logo || '',
            website: partner.website || '',
            active: partner.active ?? true,
            order: partner.order || 0
        });
        setShowModal(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, fileData: reader.result, folder: 'partners' }),
                });
                const data = await res.json();
                if (data.success) {
                    setFormData(prev => ({ ...prev, logo: data.url }));
                }
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const deletePartner = async (id) => {
        if (confirm(t('confirmDeletePartner'))) {
            await fetch(`/api/admin/partners?id=${id}`, { method: 'DELETE' });
            fetchPartners();
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> {t('loading')}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h1>{t('partnersManagementTitle')}</h1>
                <button className="btn btn-primary" onClick={() => {
                    setEditId(null);
                    setFormData({ name: '', logo: '', website: '', active: true, order: 0 });
                    setShowModal(true);
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> {t('newPartner')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {partners.map(partner => (
                    <div key={partner._id} className="card" style={{ position: 'relative', opacity: partner.active ? 1 : 0.5 }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '10px', zIndex: 10 }}>
                            <button
                                onClick={() => handleEdit(partner)}
                                style={{ background: 'rgba(17, 34, 78, 0.5)', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '5px', borderRadius: '4px' }}
                                title={t('edit')}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => deletePartner(partner._id)}
                                style={{ background: 'rgba(17, 34, 78, 0.5)', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '5px', borderRadius: '4px' }}
                                title={t('delete')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div style={{
                            height: '120px',
                            background: 'white',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                            overflow: 'hidden'
                        }}>
                            <img src={partner.logo} alt={partner.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{partner.name}</h3>
                        {partner.website && (
                            <a href={partner.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                <ExternalLink size={12} /> {t('visitWebsite')}
                            </a>
                        )}
                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>
                            {t('order')}: {partner.order} | {partner.active ? t('active') : t('inactive')}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(17, 34, 78, 0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <h2>{editId ? t('editPartner') : t('newPartner')}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>{t('partnerName')}</label>
                                <input
                                    placeholder={t('name')} className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>{t('websiteOptional')}</label>
                                <input
                                    placeholder="https://..." className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>{t('displayOrder')}</label>
                                    <input
                                        type="number" className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '1.5rem' }}>
                                    <input
                                        type="checkbox" id="active"
                                        checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    />
                                    <label htmlFor="active" style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('active')}</label>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>{t('partnerLogo')}</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {formData.logo && (
                                        <div style={{ position: 'relative', background: 'white', padding: '5px', borderRadius: '4px' }}>
                                            <img src={formData.logo} alt={t('preview')} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, logo: '' }))} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f43f5e', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '2px' }}><X size={10} /></button>
                                        </div>
                                    )}
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.75rem', flex: 1, textAlign: 'center' }}>
                                        <Upload size={14} style={{ marginRight: '5px' }} /> {uploading ? t('uploading') : t('chooseLogo')}
                                        <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading || !formData.logo}>
                                    {editId ? t('update') : t('create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
