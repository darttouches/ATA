"use client";

import { useState } from 'react';
import styles from '@/app/signup/signup.module.css'; // Reuse form styles
import { useLanguage } from '@/context/LanguageContext';

export default function ContactPage() {
    const { t } = useLanguage();
    const [status, setStatus] = useState('');

    const [formData, setFormData] = useState({ subject: '', message: '', email: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                setStatus(t('success'));
            } else {
                alert(t('error'));
            }
        } catch (error) {
            alert(t('error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>{t('contactTitle')}</h1>
            <p style={{ textAlign: 'center', marginBottom: '3rem', opacity: 0.7 }}>
                {t('contactSubtitle')}
            </p>

            <div className={styles.formCard} style={{ margin: '0 auto' }}>
                {status ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px'
                    }}>
                        {status}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('subject')}</label>
                            <select
                                className={styles.input}
                                required
                                style={{ appearance: 'auto' }}
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            >
                                <option value="">{t('selectSubject')}</option>
                                <option value="info">{t('info')}</option>
                                <option value="partenariat">{t('partnership')}</option>
                                <option value="reclamation">{t('complaint')}</option>
                                <option value="autre">{t('other')}</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('message')}</label>
                            <textarea
                                className={styles.input}
                                rows={5}
                                required
                                placeholder={t('messagePlaceholder')}
                                style={{ resize: 'vertical', minHeight: '120px' }}
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                            ></textarea>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('yourEmail')}</label>
                            <input
                                type="email" className={styles.input} required placeholder="email@exemple.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                            {submitting ? t('sending') : t('send')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
