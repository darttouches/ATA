"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Loader2, Eye, EyeOff } from 'lucide-react';
import styles from './signup.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function Signup() {
    const { t } = useLanguage();
    const router = useRouter();
    const [clubs, setClubs] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        birthDate: '',
        preferredClub: '',
        profileImage: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Interview post-signup flow
    const [isRegistered, setIsRegistered] = useState(false);
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewCode, setInterviewCode] = useState('');
    const [loadingInterview, setLoadingInterview] = useState(false);

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const res = await fetch('/api/clubs');
                const data = await res.json();
                if (res.ok) setClubs(data);
            } catch (err) {
                console.error("Failed to fetch clubs", err);
            }
        };
        fetchClubs();
    }, []);

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
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError(t('passwordsDontMatch'));
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t('error'));
            }

            // Success
            setIsRegistered(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestInterview = async (e) => {
        e.preventDefault();
        setError('');
        setLoadingInterview(true);
        try {
            const res = await fetch('/api/onboarding/interview/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    interviewDate
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Erreur serveur');
            
            setInterviewCode(data.code);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingInterview(false);
        }
    };

    if (isRegistered) {
        return (
            <div className={styles.container}>
                <div className={styles.formCard} style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <h1 className={styles.title} style={{ color: '#10b981', marginBottom: '1rem' }}>Inscription Validée !</h1>
                    
                    {!interviewCode ? (
                        <>
                            <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
                                Avant de finaliser votre inscription, vous devez passer un <strong>entretien avec notre robot</strong>. Veuillez choisir la date et l'heure (au minimum 2 jours à l'avance).
                            </p>
                            {error && <div className={styles.error}>{error}</div>}
                            <form onSubmit={handleRequestInterview} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className={styles.inputGroup} style={{ width: '100%', maxWidth: '300px' }}>
                                    <label className={styles.label}>Date de l'entretien</label>
                                    <input 
                                        type="datetime-local" 
                                        className={styles.input} 
                                        required 
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                        min={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', maxWidth: '300px', marginTop: '1rem', justifyContent: 'center' }} disabled={loadingInterview}>
                                    {loadingInterview ? 'Génération...' : 'Obtenir mon code'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
                                Votre créneau a été réservé avec succès.<br/>Voici votre code d'accès à la salle d'entretien virtuelle. <strong>Conservez-le précieusement !</strong>
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '2px dashed var(--primary)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                                <h1 style={{ fontSize: '3rem', letterSpacing: '8px', color: 'white', margin: 0 }}>
                                    {interviewCode}
                                </h1>
                            </div>
                            <button onClick={() => window.location.href = '/interview-room'} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Aller à la salle d'entretien
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.formCard} style={{ maxWidth: '600px' }}>
                <h1 className={styles.title}>{t('joinAta')}</h1>
                <p className={styles.subtitle}>{t('createAccountDesc')}</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Photo Upload Section */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '2px solid var(--primary)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {formData.profileImage ? (
                                    <Image src={formData.profileImage} alt="Profile" fill style={{ objectFit: 'cover' }} />
                                ) : (
                                    <Camera size={40} style={{ opacity: 0.3 }} />
                                )}
                            </div>
                            <label style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                background: 'var(--primary)',
                                borderRadius: '50%',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex'
                            }}>
                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="firstName">{t('firstName')}</label>
                            <input
                                type="text" id="firstName" name="firstName" className={styles.input}
                                value={formData.firstName} onChange={handleChange} required placeholder={t('firstName')}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="lastName">{t('lastName')}</label>
                            <input
                                type="text" id="lastName" name="lastName" className={styles.input}
                                value={formData.lastName} onChange={handleChange} required placeholder={t('lastName')}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="email">{t('email')}</label>
                        <input
                            type="email" id="email" name="email" className={styles.input}
                            value={formData.email} onChange={handleChange} required placeholder="votre@email.com"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="phone">{t('phoneWhatsApp')}</label>
                            <input
                                type="tel" id="phone" name="phone" className={styles.input}
                                value={formData.phone} onChange={handleChange} required placeholder="06..."
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="birthDate">{t('birthDate')}</label>
                            <input
                                type="date" id="birthDate" name="birthDate" className={styles.input}
                                value={formData.birthDate} onChange={handleChange} required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="preferredClub">{t('chooseClub')}</label>
                        <select
                            id="preferredClub" name="preferredClub" className={styles.input}
                            value={formData.preferredClub} onChange={handleChange} required
                        >
                            <option value="">{t('selectFavoriteClub')}</option>
                            {clubs.map(club => (
                                <option key={club._id} value={club._id}>{club.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="password">{t('password')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"} id="password" name="password" className={styles.input}
                                    value={formData.password} onChange={handleChange} required placeholder="••••••••" minLength={6}
                                    style={{ paddingRight: '45px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', color: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', display: 'flex'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="confirmPassword">{t('confirmPassword')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" className={styles.input}
                                    value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••"
                                    style={{ paddingRight: '45px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', color: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer', display: 'flex'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading || uploading}
                    >
                        {loading ? t('signupProgress') : t('signupAction')}
                    </button>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '1rem', textAlign: 'center' }}>
                        {t('signupNotice')}
                    </p>
                </form>

                <div className={styles.footer}>
                    {t('alreadyHaveAccount')}
                    <Link href="/login" className={styles.link}>{t('loginAction')}</Link>
                </div>
            </div>
        </div>
    );
}
