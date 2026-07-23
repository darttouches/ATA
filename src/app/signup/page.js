"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, HelpCircle, Calendar, Lock, Home } from 'lucide-react';
import styles from './signup.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function Signup() {
    const { t } = useLanguage();
    const router = useRouter();
    const [clubs, setClubs] = useState([]);
    
    // Recruitment Period State
    const [recruitmentStatus, setRecruitmentStatus] = useState({
        loading: true,
        isPeriodActive: true,
        daysRemaining: null,
        statusMessage: '',
        endDate: null
    });

    // Interview Code verification state (Season 2026/2027)
    const [interviewCodeInput, setInterviewCodeInput] = useState('');
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [codeVerified, setCodeVerified] = useState(false);
    const [codeError, setCodeError] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        birthDate: '',
        preferredClub: '',
        profileImage: '',
        interviewCode: ''
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

        const fetchRecruitmentSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    const recruitment = data.recruitment;
                    if (recruitment) {
                        if (recruitment.isOpen === false) {
                            setRecruitmentStatus({
                                loading: false,
                                isPeriodActive: false,
                                daysRemaining: 0,
                                statusMessage: "Les inscriptions sont actuellement fermées par l'administration.",
                                endDate: null
                            });
                            return;
                        }

                        const now = new Date();
                        let start = recruitment.startDate ? new Date(recruitment.startDate) : null;
                        if (start) start.setHours(0, 0, 0, 0);

                        let end = recruitment.endDate ? new Date(recruitment.endDate) : null;
                        if (end) end.setHours(23, 59, 59, 999);

                        if (start && now < start) {
                            setRecruitmentStatus({
                                loading: false,
                                isPeriodActive: false,
                                daysRemaining: 0,
                                statusMessage: `Les inscriptions pour la nouvelle saison ouvriront le ${start.toLocaleDateString('fr-FR')}.`,
                                endDate: recruitment.endDate
                            });
                            return;
                        }

                        if (end && now > end) {
                            setRecruitmentStatus({
                                loading: false,
                                isPeriodActive: false,
                                daysRemaining: 0,
                                statusMessage: `La période d'inscription est actuellement clôturée (fermée depuis le ${end.toLocaleDateString('fr-FR')}).`,
                                endDate: recruitment.endDate
                            });
                            return;
                        }

                        let daysRem = null;
                        if (end) {
                            const diffMs = end.getTime() - now.getTime();
                            daysRem = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                        }

                        setRecruitmentStatus({
                            loading: false,
                            isPeriodActive: true,
                            daysRemaining: daysRem,
                            statusMessage: end 
                                ? `Période d'inscription ouverte ! Clôture dans ${daysRem} jour(s).`
                                : "Période d'inscription actuellement ouverte.",
                            endDate: recruitment.endDate
                        });
                    } else {
                        setRecruitmentStatus({ loading: false, isPeriodActive: true, daysRemaining: null, statusMessage: '', endDate: null });
                    }
                } else {
                    setRecruitmentStatus(prev => ({ ...prev, loading: false }));
                }
            } catch (err) {
                console.error("Error loading settings:", err);
                setRecruitmentStatus(prev => ({ ...prev, loading: false }));
            }
        };

        fetchClubs();
        fetchRecruitmentSettings();
    }, []);

    const handleVerifyCode = async (codeToVerify) => {
        const code = (codeToVerify || interviewCodeInput).trim().toUpperCase();
        if (!code || code.length < 8) {
            setCodeError('Veuillez saisir les 8 caractères de votre code.');
            return;
        }
        setCodeError('');
        setVerifyingCode(true);
        try {
            const res = await fetch('/api/onboarding/interview/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setCodeVerified(false);
                throw new Error(data.error || 'Code invalide');
            }

            setCodeVerified(true);
            setFormData(prev => ({
                ...prev,
                interviewCode: code,
                firstName: data.candidate.firstName || prev.firstName,
                lastName: data.candidate.lastName || prev.lastName,
                email: data.candidate.email || prev.email,
                phone: data.candidate.phone || prev.phone
            }));
        } catch (err) {
            setCodeError(err.message);
            setCodeVerified(false);
        } finally {
            setVerifyingCode(false);
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
        setError('');

        if (!codeVerified) {
            setError("Vous devez obligatoirement valider un code d'entretien accepté par l'admin pour créer votre compte.");
            return;
        }

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

    if (recruitmentStatus.loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                    <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary, #8b5cf6)' }} />
                    <p>Vérification de la période d'inscription...</p>
                </div>
            </div>
        );
    }

    if (!recruitmentStatus.isPeriodActive) {
        return (
            <div className={styles.container} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.75rem' }}>
                <div className={styles.formCard} style={{ width: '100%', maxWidth: '520px', textAlign: 'center', padding: '2rem 1.25rem' }}>
                    <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.15)', border: '2px solid rgba(239, 68, 68, 0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                        <Lock size={30} color="#ef4444" />
                    </div>
                    
                    <h1 className={styles.title} style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                        Inscriptions Fermées
                    </h1>
                    
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {recruitmentStatus.statusMessage || "La période d'inscription pour cette saison n'est pas ouverte actuellement."}
                    </p>
                    
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.85rem 1.25rem', fontSize: '0.95rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
                    >
                        <Home size={18} /> Accéder à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    if (isRegistered) {
        return (
            <div className={styles.container}>
                <div className={styles.formCard} style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <h1 className={styles.title} style={{ color: '#10b981', marginBottom: '1rem' }}>Compte Créé avec Succès !</h1>
                    <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
                        Félicitations ! Votre compte membre ATA pour la saison 2026/2027 a été enregistré.<br/>
                        Vous pouvez dès à présent vous connecter pour accéder à votre espace membre.
                    </p>
                    <button onClick={() => window.location.href = '/login'} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                        Accéder à la page de Connexion
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.formCard} style={{ maxWidth: '600px' }}>
                <h1 className={styles.title}>{t('joinAta')} (2026/2027)</h1>
                <p className={styles.subtitle}>Formulaire officiel d'inscription des membres acceptés</p>

                {/* REGISTRATION PERIOD ANNOUNCEMENT BANNER */}
                {recruitmentStatus.isPeriodActive && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                        textAlign: 'start'
                    }}>
                        <div style={{
                            background: 'var(--primary, #8b5cf6)',
                            padding: '8px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0
                        }}>
                            <Calendar size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 600 }}>
                                📢 Remarque : Statut de la Période d'Inscription
                            </h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                                {recruitmentStatus.daysRemaining !== null ? (
                                    <>
                                        Il reste <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{recruitmentStatus.daysRemaining} jour(s)</strong> avant la fermeture des inscriptions pour cette saison.
                                        {recruitmentStatus.endDate && (
                                            <span style={{ opacity: 0.8 }}> (Clôture prévue le {new Date(recruitmentStatus.endDate).toLocaleDateString('fr-FR')})</span>
                                        )}
                                    </>
                                ) : (
                                    <span>La période d'inscription pour cette saison est actuellement ouverte.</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}

                {/* MANDATORY INTERVIEW CODE SECTION */}
                <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: '#c084fc', fontWeight: 600 }}>
                        <ShieldCheck size={20} />
                        <span>Code d'Entretien Validé (Obligatoire - Saison 2026/2027)</span>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                        Saisissez le code à 8 caractères reçu lors de votre entretien. Il doit avoir été <strong>accepté par l'administration</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Ex: XY89A12B"
                            maxLength={8}
                            value={interviewCodeInput}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setInterviewCodeInput(val);
                                if (val.length === 8) handleVerifyCode(val);
                            }}
                            style={{ letterSpacing: '3px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        />
                        <button
                            type="button"
                            onClick={() => handleVerifyCode()}
                            className="btn btn-primary"
                            disabled={verifyingCode || interviewCodeInput.length < 8}
                            style={{ minWidth: '120px', justifyContent: 'center' }}
                        >
                            {verifyingCode ? <Loader2 size={18} className="animate-spin" /> : 'Vérifier'}
                        </button>
                    </div>

                    {codeError && (
                        <p style={{ color: '#f43f5e', fontSize: '0.85rem', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                            ❌ {codeError}
                        </p>
                    )}

                    {codeVerified && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.9rem', marginTop: '0.75rem', fontWeight: 600 }}>
                            <CheckCircle2 size={18} />
                            <span>Entretien validé par l'administration ! Vos informations ont été pré-remplies.</span>
                        </div>
                    )}

                    {!codeVerified && !codeError && (
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                            Pas encore fait l'entretien ? <Link href="/join" style={{ color: '#c084fc', textDecoration: 'underline' }}>Faire une demande d'entretien</Link>
                        </p>
                    )}
                </div>

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
