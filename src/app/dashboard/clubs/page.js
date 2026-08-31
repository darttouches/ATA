"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, MapPin, Edit2, Upload, X, Camera, Lock, Mail, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';

export default function ClubsManagement() {
    const { t, formatDynamicText } = useLanguage();
    const [clubs, setClubs] = useState([]);
    const [chiefs, setChiefs] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', address: '', slug: '', chief: '', coverImage: '',
        coordinates: { lat: 36.8065, lng: 10.1815 },
        socialLinks: { facebook: '', instagram: '', youtube: '', website: '' },
        activeMembers: [],
        partnerReviews: [],
        clubEmail: '',
        clubPassword: '',
        isActive: true
    });

    const fetchClubs = useCallback(async () => {
        const res = await fetch('/api/admin/clubs');
        const data = await res.json();
        if (res.ok) setClubs(data);
    }, []);

    const fetchChiefs = useCallback(async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (res.ok) setChiefs(data.filter(u => u.role === 'president' || u.role === 'admin'));
    }, []);

    useEffect(() => {
        fetchClubs();
        fetchChiefs();
    }, [fetchClubs, fetchChiefs]);

    const resetForm = () => {
        setFormData({
            name: '', description: '', address: '', slug: '', chief: '', coverImage: '',
            coordinates: { lat: 36.8065, lng: 10.1815 },
            socialLinks: { facebook: '', instagram: '', youtube: '', website: '' },
            activeMembers: [],
            partnerReviews: [],
            clubEmail: '',
            clubPassword: '',
            isActive: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/clubs', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                setEditId(null);
                resetForm();
                fetchClubs();
                alert(t('clubSavedSuccess') || 'Club enregistré avec succès !');
            } else {
                console.error('Failed to save club:', res.status, data);
                alert(`Erreur: ${data.error}\n${data.details || ''}`);
            }
        } catch (error) {
            console.error('Error submitting club:', error);
            alert(`Erreur: ${error.message}`);
        }
    };

    const handleEdit = (club) => {
        setEditId(club._id);
        setFormData({
            name: club.name || '',
            description: club.description || '',
            address: club.address || '',
            slug: club.slug || '',
            chief: club.chief?._id || club.chief || '',
            coverImage: club.coverImage || '',
            coordinates: club.coordinates || { lat: 36.8065, lng: 10.1815 },
            socialLinks: {
                facebook: club.socialLinks?.facebook || '',
                instagram: club.socialLinks?.instagram || '',
                youtube: club.socialLinks?.youtube || '',
                website: club.socialLinks?.website || '',
            },
            activeMembers: club.activeMembers || [],
            partnerReviews: club.partnerReviews || [],
            clubEmail: club.clubAccountId?.email || '',
            clubPassword: '',
            isActive: club.isActive !== undefined ? club.isActive : true
        });
        setShowModal(true);
    };

    const toggleClubActive = async (club) => {
        const newStatus = !club.isActive;
        const confirmMsg = newStatus
            ? `Voulez-vous réactiver le club "${club.name}" ? Ses membres non désactivés individuellement par l'admin seront réactivés.`
            : `Voulez-vous désactiver le club "${club.name}" ? Tous ses membres seront aussi désactivés.`;

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/admin/clubs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: club._id, isActive: newStatus }),
            });
            if (res.ok) fetchClubs();
        } catch (err) {
            console.error('Error toggling club status:', err);
        }
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
                    body: JSON.stringify({ fileName: file.name, fileData: reader.result, folder: 'clubs' }),
                });
                const data = await res.json();
                if (data.success) {
                    setFormData(prev => ({ ...prev, coverImage: data.url }));
                }
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const updateChief = async (clubId, chiefId) => {
        await fetch('/api/admin/clubs', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: clubId, chief: chiefId }),
        });
        fetchClubs();
    };

    const addMember = () => {
        setFormData(prev => ({
            ...prev,
            activeMembers: [...prev.activeMembers, { name: '', role: '', month: '' }]
        }));
    };

    const updateMember = (index, field, value) => {
        const newMembers = [...formData.activeMembers];
        newMembers[index][field] = value;
        setFormData(prev => ({ ...prev, activeMembers: newMembers }));
    };

    const removeMember = (index) => {
        setFormData(prev => ({
            ...prev,
            activeMembers: prev.activeMembers.filter((_, i) => i !== index)
        }));
    };

    const addReview = () => {
        setFormData(prev => ({
            ...prev,
            partnerReviews: [...prev.partnerReviews, { author: '', organization: '', content: '' }]
        }));
    };

    const updateReview = (index, field, value) => {
        const newReviews = [...formData.partnerReviews];
        newReviews[index][field] = value;
        setFormData(prev => ({ ...prev, partnerReviews: newReviews }));
    };

    const removeReview = (index) => {
        setFormData(prev => ({
            ...prev,
            partnerReviews: prev.partnerReviews.filter((_, i) => i !== index)
        }));
    };

    const deleteClub = async (id) => {
        if (confirm(t('confirmDeleteClub') || 'Êtes-vous sûr de vouloir supprimer ce club ?')) {
            await fetch(`/api/admin/clubs?id=${id}`, { method: 'DELETE' });
            fetchClubs();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1>{t('clubsManagementTitle') || 'Gestion des Clubs'}</h1>
                <button className="btn btn-primary" onClick={() => {
                    setEditId(null);
                    resetForm();
                    setShowModal(true);
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> {t('newClub') || 'Nouveau Club'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {clubs.map(club => (
                    <div key={club._id} className="card" style={{ position: 'relative', opacity: club.isActive === false ? 0.6 : 1 }}>
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '10px', zIndex: 10 }}>
                            <button
                                onClick={() => handleEdit(club)}
                                style={{ background: 'rgba(15, 23, 42, 0.7)', border: 'none', color: 'var(--primary)', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                                title={t('edit') || 'Modifier'}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => deleteClub(club._id)}
                                style={{ background: 'rgba(15, 23, 42, 0.7)', border: 'none', color: '#f43f5e', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                                title={t('delete') || 'Supprimer'}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div style={{
                            height: '140px',
                            background: club.coverImage ? `url(${club.coverImage}) center/cover` : 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {!club.coverImage && <span style={{ fontSize: '2rem', fontWeight: 800, opacity: 0.2 }}>{club.name[0]}</span>}
                            <div style={{
                                position: 'absolute', bottom: '8px', left: '8px',
                                background: club.isActive !== false ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)',
                                color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                {club.isActive !== false ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                {club.isActive !== false ? 'Club Actif' : 'Club Inactif'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{formatDynamicText(club.name)}</h3>
                            <button
                                onClick={() => toggleClubActive(club)}
                                style={{
                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: club.isActive !== false ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: club.isActive !== false ? '#f43f5e' : '#10b981'
                                }}
                            >
                                {club.isActive !== false ? 'Désactiver' : 'Réactiver'}
                            </button>
                        </div>

                        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{club.description}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.8, fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <MapPin size={14} style={{ marginRight: '6px', opacity: 0.6 }} /> {club.address || 'Adresse non spécifiée'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Mail size={14} style={{ marginRight: '6px', opacity: 0.6 }} />
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                    Compte: {club.clubAccountId?.email || 'Non configuré'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ opacity: 0.6, marginRight: '4px' }}>{t('president') || 'Président'}:</span>
                                <select
                                    value={club.chief?._id || ''}
                                    onChange={(e) => updateChief(club._id, e.target.value)}
                                    style={{ background: 'none', color: 'var(--primary)', border: 'none', fontSize: '0.8rem' }}
                                >
                                    <option value="">{t('selectPresident') || 'Sélectionner le président'}</option>
                                    {chiefs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <h2>{editId ? (t('editClub') || 'Modifier le Club') : (t('newClub') || 'Nouveau Club')}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            
                            {/* Account Login Credentials for Club */}
                            <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Lock size={16} /> Compte Officiel du Club (Authentification)
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Email de connexion</label>
                                        <input
                                            type="email"
                                            placeholder="club.name@ata.tn" className="card"
                                            style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                            value={formData.clubEmail} onChange={e => setFormData({ ...formData, clubEmail: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                            {editId ? 'Mot de passe (laisser vide si inchangé)' : 'Mot de passe'}
                                        </label>
                                        <input
                                            type="password"
                                            placeholder={editId ? '••••••••' : 'Mot de passe'} className="card"
                                            style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                            value={formData.clubPassword} onChange={e => setFormData({ ...formData, clubPassword: e.target.value })}
                                            required={!editId}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                                <input
                                    placeholder={t('clubName') || 'Nom du club'} className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder={t('slugLabel') || 'Slug URL'} className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                />
                            </div>

                            <textarea
                                placeholder={t('description') || 'Description'} className="card"
                                style={{ width: '100%', marginBottom: '1rem', border: '1px solid var(--card-border)', minHeight: '80px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                            
                            <input
                                placeholder={t('addressLocal') || 'Adresse'} className="card"
                                style={{ width: '100%', marginBottom: '1rem', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Latitude</label>
                                    <input
                                        type="number" step="any" className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.coordinates.lat} onChange={e => setFormData({ ...formData, coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) } })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Longitude</label>
                                    <input
                                        type="number" step="any" className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.coordinates.lng} onChange={e => setFormData({ ...formData, coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) } })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>{t('socialLinks') || 'Réseaux Sociaux'}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input
                                        placeholder="Facebook URL" className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)', fontSize: '0.8rem', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.socialLinks.facebook} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })}
                                    />
                                    <input
                                        placeholder="Instagram URL" className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)', fontSize: '0.8rem', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.socialLinks.instagram} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                                    />
                                    <input
                                        placeholder="YouTube URL" className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)', fontSize: '0.8rem', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.socialLinks.youtube} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
                                    />
                                    <input
                                        placeholder="Site Web" className="card"
                                        style={{ width: '100%', border: '1px solid var(--card-border)', fontSize: '0.8rem', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={formData.socialLinks.website} onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>Président du Club</label>
                                <select
                                    className="card"
                                    style={{ width: '100%', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.chief} onChange={e => setFormData({ ...formData, chief: e.target.value })}
                                >
                                    <option value="" style={{ background: '#11224E', color: 'white' }}>{t('selectPresident') || 'Sélectionner le président'}</option>
                                    {chiefs.map(c => <option key={c._id} value={c._id} style={{ background: '#11224E', color: 'white' }}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Active Members */}
                            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('activeMembersLabel') || 'Membres Actifs (Mise en avant)'}</label>
                                    <button type="button" onClick={addMember} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}><Plus size={12} /> {t('add') || 'Ajouter'}</button>
                                </div>
                                {formData.activeMembers.map((member, idx) => (
                                    <div key={idx} style={{ marginBottom: '10px', padding: '10px', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                                                {member.photo ? (
                                                    <Image src={member.photo} alt={member.name || ""} fill style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Camera size={16} style={{ opacity: 0.3 }} /></div>
                                                )}
                                                <input
                                                    type="file"
                                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        const reader = new FileReader();
                                                        reader.onloadend = async () => {
                                                            const res = await fetch('/api/upload', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ fileName: file.name, fileData: reader.result }),
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) updateMember(idx, 'photo', data.url);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                            </div>
                                            <input placeholder={t('yourName') || 'Nom'} className="card" style={{ fontSize: '0.75rem', padding: '5px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={member.name} onChange={e => updateMember(idx, 'name', e.target.value)} />
                                            <input placeholder={t('role') || 'Rôle'} className="card" style={{ fontSize: '0.75rem', padding: '5px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={member.role} onChange={e => updateMember(idx, 'role', e.target.value)} />
                                            <input placeholder="Mois" className="card" style={{ fontSize: '0.75rem', padding: '5px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={member.month} onChange={e => updateMember(idx, 'month', e.target.value)} />
                                            <button type="button" onClick={() => removeMember(idx)} style={{ background: 'none', border: 'none', color: '#f43f5e' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Partner Reviews */}
                            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('partnerReviewsLabel') || 'Avis Partenaires'}</label>
                                    <button type="button" onClick={addReview} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}><Plus size={12} /> {t('add') || 'Ajouter'}</button>
                                </div>
                                {formData.partnerReviews.map((review, idx) => (
                                    <div key={idx} style={{ marginBottom: '10px', border: '1px solid var(--card-border)', padding: '8px', borderRadius: '4px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '5px', marginBottom: '5px' }}>
                                            <input placeholder="Auteur" className="card" style={{ fontSize: '0.75rem', padding: '5px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={review.author} onChange={e => updateReview(idx, 'author', e.target.value)} />
                                            <input placeholder="Orga" className="card" style={{ fontSize: '0.75rem', padding: '5px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={review.organization} onChange={e => updateReview(idx, 'organization', e.target.value)} />
                                            <button type="button" onClick={() => removeReview(idx)} style={{ background: 'none', border: 'none', color: '#f43f5e' }}><Trash2 size={14} /></button>
                                        </div>
                                        <textarea placeholder={t('message') || 'Avis'} className="card" style={{ width: '100%', fontSize: '0.75rem', padding: '5px', minHeight: '40px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={review.content} onChange={e => updateReview(idx, 'content', e.target.value)} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>{t('coverImage') || 'Image de couverture'}</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {formData.coverImage && (
                                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                                            <Image src={formData.coverImage} alt="Preview" fill style={{ objectFit: 'cover' }} />
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))} style={{ position: 'absolute', top: '2px', right: '2px', background: '#f43f5e', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '2px', zIndex: 10 }}><X size={10} /></button>
                                        </div>
                                    )}
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.75rem', flex: 1, textAlign: 'center' }}>
                                        <Upload size={14} style={{ marginRight: '5px' }} /> {uploading ? (t('uploading') || 'Téléversement...') : (t('chooseImage') || 'Choisir une image')}
                                        <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditId(null); resetForm(); }}>{t('cancel') || 'Annuler'}</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                                    {editId ? (t('update') || 'Mettre à jour') : (t('createClub') || 'Créer le club')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
