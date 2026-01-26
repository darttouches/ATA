"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, ExternalLink, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function NotificationsPage() {
    const { t, language } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();

            if (res.ok) {
                setNotifications(data);
            } else {
                setError(data.error || t('errorLoading'));
            }
        } catch (err) {
            setError(t('serverConnectionError'));
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        for (const n of unread) {
            markAsRead(n._id);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2rem' }}>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <RefreshCw style={{ animation: 'spin 1s linear infinite' }} size={20} />
            <p>{t('loadingNotifications')}</p>
        </div>
    );

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>{t('notificationsTitle')}</h1>
                {notifications.some(n => !n.isRead) && (
                    <button onClick={markAllAsRead} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                        {t('markAllAsRead')}
                    </button>
                )}
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchNotifications} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>{t('retry')}</button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notifications.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <BellOff size={48} style={{ margin: '0 auto 1.5rem', display: 'block', opacity: 0.2 }} />
                        <p style={{ fontSize: '1.1rem' }}>{t('noNotifications')}</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification._id}
                            className="card"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                opacity: notification.isRead ? 0.6 : 1,
                                borderLeft: notification.isRead ? '1px solid var(--card-border)' : '4px solid var(--primary)',
                                transition: 'all 0.3s',
                                padding: '1.25rem 1.5rem',
                                background: notification.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
                                    {!notification.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{notification.title}</h3>
                                </div>
                                <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '0.5rem', lineHeight: '1.4' }}>{notification.message}</p>
                                <div style={{ fontSize: '0.8rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Bell size={12} />
                                    {new Date(notification.createdAt).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR', {
                                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginLeft: '1.5rem' }}>
                                {!notification.isRead && (
                                    <button
                                        onClick={() => markAsRead(notification._id)}
                                        style={{
                                            background: 'rgba(124, 58, 237, 0.1)',
                                            border: 'none',
                                            color: 'var(--primary)',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        title={t('markAsRead')}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'}
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                                {notification.link && (
                                    <a
                                        href={notification.link}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        title={t('viewDetails')}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        {notification.link.includes('reclamations') || notification.link.includes('management') ? <AlertCircle size={18} /> : <ExternalLink size={18} />}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
