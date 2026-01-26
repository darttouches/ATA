'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../login/login.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPassword() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
            } else {
                setError(data.error || t('error'));
            }
        } catch (err) {
            setError(t('serverError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>{t('forgotPasswordTitle')}</h1>
                <p className={styles.subtitle}>
                    {t('forgotPasswordSubtitle')}
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
                        <label htmlFor="email-address" className={styles.label}>{t('email')}</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className={styles.input}
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        {loading ? t('sendingLink') : t('sendResetLink')}
                    </button>

                    <div className={styles.footer}>
                        <Link href="/login" className={styles.link}>
                            {t('backToLogin')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
