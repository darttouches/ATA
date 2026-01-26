"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload, X, Loader2, User as UserIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function BoardManagement() {
    const { t } = useLanguage();
    const [members, setMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        photo: '',
        active: true,
        order: 0
    });

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/board');
        if (res.ok) {
            const data = await res.json();
            setMembers(data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch('/api/admin/board', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
        });
        if (res.ok) {
            setShowModal(false);
            setEditId(null);
            setFormData({ name: '', role: '', photo: '', active: true, order: 0 });
            fetchMembers();
        }
    };

    const handleEdit = (member) => {
        setEditId(member._id);
        setFormData({
            name: member.name || '',
            role: member.role || '',
            photo: member.photo || '',
            active: member.active ?? true,
            order: member.order || 0
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
                    body: JSON.stringify({ fileName: file.name, fileData: reader.result, folder: 'board' }),
                });
                const data = await res.json();
                if (data.success) {
                    setFormData(prev => ({ ...prev, photo: data.url }));
                }
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const deleteMember = async (id) => {
        if (confirm(t('confirmDeleteMember'))) {
            await fetch(`/api/admin/board?id=${id}`, { method: 'DELETE' });
            fetchMembers();
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> {t('loading')}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h1>{t('nationalBoardTitle')}</h1>
                <button className="btn btn-primary" onClick={() => {
                    setEditId(null);
                    setFormData({ name: '', role: '', photo: '', active: true, order: 0 });
                    setShowModal(true);
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> {t('newMember')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {members.map(member => (
                    <div key={member._id} className="card" style={{ position: 'relative', opacity: member.active ? 1 : 0.5 }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '10px', zIndex: 10 }}>
                            <button
                                onClick={() => handleEdit(member)}
                                style={{ background: 'rgba(17, 34, 78, 0.5)', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '5px', borderRadius: '4px' }}
                                title={t('edit')}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => deleteMember(member._id)}
                                style={{ background: 'rgba(17, 34, 78, 0.5)', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '5px', borderRadius: '4px' }}
                                title={t('delete')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            margin: '0 auto 1.5rem',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '3px solid var(--primary)',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {member.photo ? (
                                <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <UserIcon size={40} style={{ opacity: 0.2 }} />
                            )}
                        </div>
                        <h3 style={{ textAlign: 'center', marginBottom: '0.25rem', fontSize: '1.1rem' }}>{member.name}</h3>
                        <p style={{ textAlign: 'center', color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>{member.role}</p>
                        <div style={{ marginTop: 'auto', fontSize: '0.8rem', opacity: 0.6, textAlign: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem' }}>
                            {t('order')}: {member.order} | {member.active ? t('active') : t('inactive')}
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
                        <h2>{editId ? t('editMember') : t('newMember')}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>{t('fullName')}</label>
                                <input
                                    placeholder={t('name')} className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>{t('roleFunction')}</label>
                                <input
                                    placeholder={t('rolePlaceholder')} className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    required
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
                                        type="checkbox" id="activeMember"
                                        checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    />
                                    <label htmlFor="activeMember" style={{ fontSize: '0.9rem', opacity: 0.8 }}>{t('active')}</label>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>{t('memberPhoto')}</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {formData.photo && (
                                        <div style={{ position: 'relative' }}>
                                            <img src={formData.photo} alt={t('preview')} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, photo: '' }))} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f43f5e', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '2px' }}><X size={10} /></button>
                                        </div>
                                    )}
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.75rem', flex: 1, textAlign: 'center' }}>
                                        <Upload size={14} style={{ marginRight: '5px' }} /> {uploading ? t('uploading') : t('choosePhoto')}
                                        <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading || !formData.photo}>
                                    {editId ? t('update') : t('addToBoard')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
