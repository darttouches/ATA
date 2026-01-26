"use client";

import { useState, useEffect } from 'react';
import { Send, User, UserX, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function MemberVoicePage() {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        message: '',
        isAnonymous: true,
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    setFormData(prev => ({
                        ...prev,
                        name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.name,
                        email: data.user.email,
                        phone: data.user.phone || ''
                    }));
                }
            })
            .catch(err => console.error("Failed to fetch user:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/member-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSuccess(true);
                setFormData({
                    message: '',
                    isAnonymous: true,
                    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name : '',
                    email: user ? user.email : '',
                    phone: user ? user.phone || '' : ''
                });
            } else {
                const data = await res.json();
                setError(data.details || data.error || t('error'));
            }
        } catch (err) {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{t('messageSentSuccess')}</h2>
                    <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                        {t('messageSentDesc')}
                    </p>
                    <button onClick={() => setSuccess(false)} className="btn btn-primary">
                        {t('sendAnother')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>{t('memberVoiceTitle')}</h1>
                    <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>
                        {t('memberVoiceSubtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 600 }}>
                            {t('yourMessageLabel')} <span style={{ color: '#f43f5e' }}>*</span>
                        </label>
                        <textarea
                            required
                            className="input"
                            rows="6"
                            placeholder={t('messagePlaceholderVoice')}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>
                            {t('submissionMode')}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isAnonymous: true })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: formData.isAnonymous ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    background: formData.isAnonymous ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                    color: formData.isAnonymous ? 'var(--primary)' : 'inherit',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: 600
                                }}
                            >
                                <UserX size={20} /> {t('anonymousMode')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isAnonymous: false })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: !formData.isAnonymous ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    background: !formData.isAnonymous ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                    color: !formData.isAnonymous ? 'var(--primary)' : 'inherit',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: 600
                                }}
                            >
                                <User size={20} /> {t('identifiedMode')}
                            </button>
                        </div>
                    </div>

                    {!formData.isAnonymous && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>{t('fullName')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    disabled
                                    value={formData.name}
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    disabled
                                    value={formData.email}
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Téléphone</label>
                                <input
                                    type="tel"
                                    className="input"
                                    disabled
                                    value={formData.phone}
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {loading ? t('sendingVoice') : (
                            <>
                                <Send size={20} /> {t('sendMyMessage')}
                            </>
                        )}
                    </button>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.5, textAlign: 'center' }}>
                        <MessageSquare size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                        {t('adminNotice')}
                    </p>
                </form>
            </div>
        </div>
    );
}
