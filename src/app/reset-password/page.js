'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/login.module.css';
import { useLanguage } from '@/context/LanguageContext';

function ResetPasswordForm() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError(t('invalidToken'));
        }
    }, [token, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('passwordsDontMatch'));
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(t('resetSuccessRedirect'));
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.error || t('error'));
            }
        } catch (err) {
            setError(t('serverError'));
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className={styles.container}>
                <div className={styles.formCard} style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>{t('error')}</h2>
                    <p style={{ marginBottom: '2rem', opacity: 0.8 }}>{t('invalidToken')}</p>
                    <Link href="/forgot-password" className={styles.link}>
                        {t('requestNewLink')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>{t('newPasswordTitle')}</h1>
                <p className={styles.subtitle}>
                    {t('newPasswordSubtitle')}
                </p>

                {message && (
                    <div className={styles.success}>
                        {message}
                    </div>
                )}
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>{t('password')}</label>
                        <input
                            type="password"
                            required
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>{t('confirmPassword')}</label>
                        <input
                            type="password"
                            required
                            className={styles.input}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        {loading ? t('resettingBtn') : t('resetPasswordBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div className={styles.container} style={{ textAlign: 'center' }}>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
