"use client";

import { useState, useEffect, useCallback } from 'react';
import { Camera, Upload, Loader2, Save, User as UserIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';

export default function ProfilePage() {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        birthDate: '',
        preferredClub: '',
        profileImage: '',
        newPassword: '',
        confirmPassword: '',
        facebook: '',
        instagram: '',
        whatsapp: '',
        linkedin: '',
        website: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (res.ok) {
                setUser(data);
                setFormData(prev => ({
                    ...prev,
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    phone: data.phone || '',
                    birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
                    preferredClub: data.preferredClub?._id || data.preferredClub || '',
                    profileImage: data.profileImage || '',
                    facebook: data.facebook || '',
                    instagram: data.instagram || '',
                    whatsapp: data.whatsapp || '',
                    linkedin: data.linkedin || '',
                    website: data.website || ''
                }));
            }
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    }, []); // Removed unnecessary t dependency

    const fetchClubs = useCallback(async () => {
        try {
            const res = await fetch('/api/clubs');
            const data = await res.json();
            if (res.ok) setClubs(data);
        } catch (err) {
            console.error("Failed to fetch clubs", err);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchClubs();
    }, [fetchProfile, fetchClubs]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                    body: JSON.stringify({ fileName: file.name, fileData: reader.result, folder: 'profiles' }),
                });
                const data = await res.json();
                if (data.success) {
                    setFormData(prev => ({ ...prev, profileImage: data.url }));
                }
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
                setSaving(false);
                return;
            }
            if (formData.newPassword.length < 6) {
                setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
                setSaving(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: t('profileUpdated') });
                setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
                fetchProfile();
            } else {
                setMessage({ type: 'error', text: t('updateError') });
            }
        } catch (error) {
            setMessage({ type: 'error', text: t('serverError') });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>;

    if (!user) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>{t('sessionExpired')}</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem' }}>{t('profileTitle')}</h1>

            {message.text && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    color: message.type === 'success' ? '#10b981' : '#f43f5e',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#f43f5e'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ padding: '2.5rem' }}>
                <form onSubmit={handleSubmit}>
                    {/* Header with Photo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '2rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '3px solid var(--primary)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {formData.profileImage ? (
                                    <Image src={formData.profileImage} alt={t('myProfile')} fill style={{ objectFit: 'cover' }} />
                                ) : (
                                    <UserIcon size={60} style={{ opacity: 0.2 }} />
                                )}
                            </div>
                            <label style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '5px',
                                background: 'var(--primary)',
                                borderRadius: '50%',
                                padding: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                border: '2px solid #11224E'
                            }}>
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                            </label>
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>{user.name}</h2>
                            <p style={{ opacity: 0.6, margin: '5px 0' }}>{user.email}</p>
                            <div style={{
                                background: 'var(--primary)',
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                {user.role === 'president' ? t('president') : user.role} - {user.status}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('firstName')}</label>
                            <input
                                type="text" name="firstName" className="card" style={{ width: '100%', padding: '12px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={formData.firstName} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('lastName')}</label>
                            <input
                                type="text" name="lastName" className="card" style={{ width: '100%', padding: '12px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={formData.lastName} onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('phoneWhatsApp')}</label>
                            <input
                                type="tel" name="phone" className="card" style={{ width: '100%', padding: '12px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={formData.phone} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('birthDate')}</label>
                            <input
                                type="date" name="birthDate" className="card" style={{ width: '100%', padding: '12px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                value={formData.birthDate} onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('favoriteClub')}</label>
                        <select
                            name="preferredClub" className="card" style={{ width: '100%', padding: '12px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                            value={formData.preferredClub} onChange={handleChange}
                        >
                            <option value="" style={{ background: '#11224E', color: 'white' }}>{t('selectClub')}</option>
                            {clubs.map(club => (
                                <option key={club._id} value={club._id} style={{ background: '#11224E', color: 'white' }}>{club.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '12px', marginBottom: '2.5rem', border: '1px solid var(--card-border)' }}>
                        <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1.2rem', color: 'var(--primary)' }}>{t('socialLinks')}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.8 }}>Facebook URL</label>
                                <input
                                    type="text" name="facebook" className="card" style={{ width: '100%', padding: '10px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.facebook} onChange={handleChange}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.8 }}>Instagram URL</label>
                                <input
                                    type="text" name="instagram" className="card" style={{ width: '100%', padding: '10px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.instagram} onChange={handleChange}
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.8 }}>WhatsApp (Format: 216XXXXXXXX)</label>
                                <input
                                    type="text" name="whatsapp" className="card" style={{ width: '100%', padding: '10px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.whatsapp} onChange={handleChange}
                                    placeholder="21620000000"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.8 }}>LinkedIn URL</label>
                                <input
                                    type="text" name="linkedin" className="card" style={{ width: '100%', padding: '10px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.linkedin} onChange={handleChange}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('websiteOptional')}</label>
                                <input
                                    type="text" name="website" className="card" style={{ width: '100%', padding: '10px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.website} onChange={handleChange}
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '12px', marginBottom: '2.5rem', border: '1px solid var(--card-border)' }}>
                        <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1rem', color: '#f43f5e' }}>{t('security')}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('newPassword')}</label>
                                <input
                                    type="password" name="newPassword" className="card" style={{ width: '100%', padding: '12px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.newPassword} onChange={handleChange}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{t('confirmPassword')}</label>
                                <input
                                    type="password" name="confirmPassword" className="card" style={{ width: '100%', padding: '12px', background: 'rgba(17, 34, 78, 0.5)', color: 'white' }}
                                    value={formData.confirmPassword} onChange={handleChange}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit" className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 30px' }}
                            disabled={saving || uploading}
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {t('saveChanges')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
