"use client";

import { useState, useEffect } from 'react';
import { Camera, Upload, Loader2, Save, User as UserIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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
        profileImage: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
        fetchClubs();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (res.ok) {
                setUser(data);
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    phone: data.phone || '',
                    birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
                    preferredClub: data.preferredClub?._id || data.preferredClub || '',
                    profileImage: data.profileImage || ''
                });
            }
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClubs = async () => {
        try {
            const res = await fetch('/api/clubs');
            const data = await res.json();
            if (res.ok) setClubs(data);
        } catch (err) {
            console.error("Failed to fetch clubs", err);
        }
    };

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

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: t('profileUpdated') });
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

    if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('loadingProfile')}</div>;

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
                                justifyContent: 'center'
                            }}>
                                {formData.profileImage ? (
                                    <img src={formData.profileImage} alt={t('myProfile')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
