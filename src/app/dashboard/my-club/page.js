"use client";

import { useState, useEffect, useCallback } from 'react';
import { Save, Globe, Facebook, Instagram, Youtube, Upload, Trash2, Plus, User, Users, Edit3, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function MyClubManagement() {
    const { t, formatDynamicText } = useLanguage();
    const [club, setClub] = useState(null);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // Bureau management
    const [bureauMembers, setBureauMembers] = useState([]);
    const [bureauSaving, setBureauSaving] = useState(false);
    const [bureauMsg, setBureauMsg] = useState(null);

    const BUREAU_ROLES = [
        '', 'Président', 'Vice-Président', 'Secrétaire Général',
        'Responsable RH', 'Responsable des Événements', 'Responsable Média', 'Membre du Bureau'
    ];

    const fetchMembers = useCallback(async () => {
        const res = await fetch('/api/dashboard/members');
        if (res.ok) {
            const data = await res.json();
            setAvailableMembers(data.data);
        }
    }, []);

    const fetchClub = useCallback(async () => {
        const res = await fetch('/api/chef/my-club');
        if (res.ok) {
            const data = await res.json();
            setClub(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const load = async () => {
            await fetchClub();
            await fetchMembers();
        };
        load();
    }, [fetchClub, fetchMembers]);

    // Load bureau members once club is loaded
    useEffect(() => {
        if (!club?._id) return;
        fetch(`/api/clubs/bureau?clubId=${club._id}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) setBureauMembers(data.members);
            })
            .catch(console.error);
    }, [club?._id]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: reader.result,
                    folder: 'clubs'
                }),
            });

            const data = await res.json();
            if (data.success) {
                setClub({ ...club, coverImage: data.url });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await fetch('/api/chef/my-club', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(club),
        });
        if (res.ok) {
            alert(t('changesSaved'));
        }
        setSaving(false);
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('loadingMyClub')}</div>;
    if (!club) return <div className="card">{t('noClubAssigned')}</div>;

    const addActiveMember = () => {
        const members = [...(club.activeMembers || [])];
        members.push({ name: '', role: '', month: '', photo: '' });
        setClub({ ...club, activeMembers: members });
    };

    const removeActiveMember = (index) => {
        const members = club.activeMembers.filter((_, i) => i !== index);
        setClub({ ...club, activeMembers: members });
    };

    const updateMember = (index, field, value) => {
        const members = [...club.activeMembers];
        members[index][field] = value;
        setClub({ ...club, activeMembers: members });
    };

    const addReview = () => {
        const reviews = [...(club.partnerReviews || [])];
        reviews.push({ author: '', content: '', organization: '' });
        setClub({ ...club, partnerReviews: reviews });
    };

    const removeReview = (index) => {
        const reviews = club.partnerReviews.filter((_, i) => i !== index);
        setClub({ ...club, partnerReviews: reviews });
    };

    const updateReview = (index, field, value) => {
        const reviews = [...club.partnerReviews];
        reviews[index][field] = value;
        setClub({ ...club, partnerReviews: reviews });
    };

    const saveBureauRole = async (memberId, clubRole) => {
        setBureauSaving(true);
        setBureauMsg(null);
        try {
            const res = await fetch('/api/clubs/bureau', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, clubRole, clubId: club._id })
            });
            const data = await res.json();
            if (data.success) {
                setBureauMsg({ type: 'success', text: 'Poste mis à jour avec succès !' });
                // Update local state
                setBureauMembers(prev => prev.map(m => m._id === memberId ? { ...m, clubRole } : m));
            } else {
                setBureauMsg({ type: 'error', text: data.error });
            }
        } catch {
            setBureauMsg({ type: 'error', text: 'Erreur réseau.' });
        } finally {
            setBureauSaving(false);
            setTimeout(() => setBureauMsg(null), 3000);
        }
    };

    return (
        <div style={{ maxWidth: '900px', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>{t('manageMyPage')} : <span style={{ color: 'var(--primary)' }}>{formatDynamicText(club.name)}</span></h1>

            <form onSubmit={handleSave}>
                {/* Core Info */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>{t('identityDescription')}</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t('clubDescription')}</label>
                        <textarea
                            className="card"
                            style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', minHeight: '120px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                            value={club.description}
                            onChange={e => setClub({ ...club, description: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t('addressLocal')}</label>
                            <input
                                className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={club.address || ''}
                                onChange={e => setClub({ ...club, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t('coverImage')}</label>
                                    <label className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}>
                                        {t('import') || 'Importer'} <Upload size={12} />
                                        <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                                <input
                                    className="card" style={{ width: '100%', marginTop: '5px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={club.coverImage || ''}
                                    onChange={e => setClub({ ...club, coverImage: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3>{t('socialLinks')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Facebook size={18} />
                            <input
                                placeholder="URL Facebook" className="card"
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={club.socialLinks?.facebook || ''}
                                onChange={e => setClub({ ...club, socialLinks: { ...club.socialLinks, facebook: e.target.value } })}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Instagram size={18} />
                            <input
                                placeholder="URL Instagram" className="card"
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={club.socialLinks?.instagram || ''}
                                onChange={e => setClub({ ...club, socialLinks: { ...club.socialLinks, instagram: e.target.value } })}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Youtube size={18} />
                            <input
                                placeholder="URL Youtube" className="card"
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={club.socialLinks?.youtube || ''}
                                onChange={e => setClub({ ...club, socialLinks: { ...club.socialLinks, youtube: e.target.value } })}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe size={18} />
                            <input
                                placeholder="Site Web" className="card"
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={club.socialLinks?.website || ''}
                                onChange={e => setClub({ ...club, socialLinks: { ...club.socialLinks, website: e.target.value } })}
                            />
                        </div>
                    </div>
                </div>

                {/* Bureau Management */}
                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(124, 58, 237, 0.3)', background: 'rgba(124, 58, 237, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={20} color="#a78bfa" /> Gestion du Bureau du Club
                            </h3>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>Le poste attribué apparaitra dynamiquement sur la carte de membre de chaque adhérent.</p>
                        </div>
                        {bureauMsg && (
                            <div style={{
                                fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px',
                                background: bureauMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: bureauMsg.type === 'success' ? '#10b981' : '#ef4444',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <Check size={14} /> {bureauMsg.text}
                            </div>
                        )}
                    </div>

                    {bureauMembers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                            Aucun membre trouvé pour ce club.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {bureauMembers.map(member => (
                                <div key={member._id} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                                    gap: '1rem', alignItems: 'center',
                                    padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>
                                            {member.profileImage
                                                ? <img src={member.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : (member.firstName?.[0] || member.name?.[0] || <User size={16} />)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.firstName || member.name} {member.lastName || ''}</div>
                                            <div style={{ fontSize: '0.72rem', opacity: 0.5 }}>N° {member.memberNumber || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <select
                                        value={member.clubRole || ''}
                                        onChange={e => setBureauMembers(prev => prev.map(m => m._id === member._id ? { ...m, clubRole: e.target.value } : m))}
                                        style={{
                                            background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(124, 58, 237, 0.3)',
                                            color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', outline: 'none'
                                        }}
                                    >
                                        {BUREAU_ROLES.map(r => (
                                            <option key={r} value={r}>{r || '-- Aucun poste --'}</option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        disabled={bureauSaving}
                                        onClick={() => saveBureauRole(member._id, member.clubRole)}
                                        style={{
                                            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                                            color: 'white', border: 'none', padding: '8px 16px',
                                            borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                                            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <Edit3 size={14} /> Enregistrer
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ marginBottom: '0.2rem' }}>{t('activeMembersOfMonth')}</h3>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('selectMembersToHighlight')}</p>
                        </div>
                        <button type="button" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '8px' }} onClick={addActiveMember}>
                            <Plus size={16} /> {t('addMember')}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {club.activeMembers?.map((member, index) => (
                            <div key={index} style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(200px, 2fr) 1.5fr 1fr auto',
                                gap: '15px',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                alignItems: 'center'
                            }}>
                                {/* Member Selection */}
                                <div>
                                    <label style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '5px', display: 'block' }}>{t('chooseMember')}</label>
                                    <select
                                        className="card"
                                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem', background: 'rgba(17, 34, 78, 0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                        value={availableMembers.find(m => m.name === member.name)?._id || ''}
                                        onChange={e => {
                                            const selected = availableMembers.find(m => m._id === e.target.value);
                                            if (selected) {
                                                const members = [...club.activeMembers];
                                                members[index].name = `${selected.firstName} ${selected.lastName}`;
                                                members[index].photo = selected.profileImage;
                                                members[index].role = selected.role || '';
                                                setClub({ ...club, activeMembers: members });
                                            }
                                        }}
                                    >
                                        <option value="">{t('selectMember')}</option>
                                        {availableMembers.map(m => (
                                            <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role === 'president' ? t('president') : (m.role || t('member'))})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '5px', display: 'block' }}>{t('roleOptional')}</label>
                                    <input
                                        placeholder="Ex: Passionné"
                                        className="card"
                                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={member.role}
                                        onChange={e => updateMember(index, 'role', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '5px', display: 'block' }}>{t('period')}</label>
                                    <input
                                        placeholder="Mois/Année"
                                        className="card"
                                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                        value={member.month}
                                        onChange={e => updateMember(index, 'month', e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeActiveMember(index)}
                                    style={{ background: 'rgba(244, 63, 94, 0.1)', border: 'none', color: '#f43f5e', padding: '10px', borderRadius: '8px', marginTop: '20px' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}

                        {(!club.activeMembers || club.activeMembers.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                {t('noFeaturedMembers')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Partner Reviews */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>{t('reviewsTestimonials')}</h3>
                        <button type="button" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={addReview}>
                            + {t('addReview')}
                        </button>
                    </div>
                    {club.partnerReviews?.map((review, index) => (
                        <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input placeholder={t('author')} className="card" style={{ flex: 1, padding: '8px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={review.author} onChange={e => updateReview(index, 'author', e.target.value)} />
                                <input placeholder={t('organization')} className="card" style={{ flex: 1, padding: '8px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={review.organization} onChange={e => updateReview(index, 'organization', e.target.value)} />
                                <button type="button" onClick={() => removeReview(index)} style={{ background: 'none', border: 'none', color: '#f43f5e' }}><Trash2 size={16} /></button>
                            </div>
                            <textarea placeholder={t('reviewContent')} className="card" style={{ width: '100%', padding: '8px', fontSize: '0.9rem', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }} value={review.content} onChange={e => updateReview(index, 'content', e.target.value)} />
                        </div>
                    ))}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={saving}>
                    <Save size={18} style={{ marginRight: '8px' }} />
                    {saving ? t('savingChanges') : t('saveAllChanges')}
                </button>
            </form>
        </div>
    );
}
