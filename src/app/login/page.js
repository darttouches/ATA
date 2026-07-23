"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Bot } from 'lucide-react';
import styles from './login.module.css';
import { useLanguage } from '@/context/LanguageContext';

function LoginForm() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(true);

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.recruitment) {
                    const { isOpen, startDate, endDate } = data.recruitment;
                    if (!isOpen) {
                        setIsRecruitmentOpen(false);
                        return;
                    }
                    
                    const now = new Date();
                    if (startDate && new Date(startDate) > now) {
                        setIsRecruitmentOpen(false);
                        return;
                    }
                    
                    if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        if (end < now) {
                            setIsRecruitmentOpen(false);
                            return;
                        }
                    }
                }
            })
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t('error'));
            }

            // Refresh router to update server components (e.g. Navbar)
            router.refresh();

            // Redirect to dashboard for everyone authenticated
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>{t('loginTitle')}</h1>
                <p className={styles.subtitle}>{t('welcomeBack')}</p>

                {registered && (
                    <div className={styles.success}>
                        {t('accountCreatedSuccess')}
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="email">{t('email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="votre@email.com"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.label} htmlFor="password">{t('password')}</label>
                            <Link href="/forgot-password" className={styles.link} style={{ fontSize: '0.8rem' }}>
                                {t('forgotPassword')}
                            </Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                className={styles.input}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
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

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? t('logInProgress') : t('loginAction')}
                    </button>
                </form>

                <div className={styles.footer}>
                    {t('noAccountYet')}
                    <Link href="/signup" className={styles.link}>{t('signupAction')}</Link>
                </div>
                
                {isRecruitmentOpen && (
                    <>
                        <div className={styles.joinSection}>
                            <p className={styles.joinText}>
                                Vous souhaitez devenir membre officiel de l'association ?
                            </p>
                            <Link href="/join" className={styles.joinBtn}>
                                <UserPlus size={18} />
                                <span>Faire une demande d'adhésion</span>
                            </Link>
                        </div>

                        <div className={styles.joinSection} style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                            <p className={styles.joinText}>
                                Vous avez un code d'entretien candidat ?
                            </p>
                            <Link 
                                href="/interview-room" 
                                className={styles.joinBtn} 
                                style={{ background: 'rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.4)', color: '#c084fc' }}
                            >
                                <Bot size={18} />
                                <span>Accéder à la salle d'entretien</span>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
        </>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
