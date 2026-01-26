"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={styles.input}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
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
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
