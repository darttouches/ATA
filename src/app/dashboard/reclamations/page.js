"use client";

import { useState, useEffect } from 'react';
import { Mail, Trash2, CheckCircle, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ReclamationsManagement() {
    const { t } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        const res = await fetch('/api/admin/messages');
        const data = await res.json();
        if (res.ok) {
            setMessages(data);
        }
        setLoading(false);
    };

    const updateStatus = async (id, status) => {
        await fetch('/api/admin/messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        fetchMessages();
    };

    const deleteMessage = async (id) => {
        if (confirm(t('confirmDeleteUser'))) { // Reusing confirm delete user for now or add specific one
            await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
            fetchMessages();
        }
    };

    const getSubjectLabel = (subject) => {
        switch (subject) {
            case 'info': return t('subjectInfo');
            case 'partenariat': return t('subjectPartnership');
            case 'reclamation': return t('subjectComplaint');
            default: return t('other');
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>{t('reclamationsTitle')}</h1>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {messages.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', opacity: 0.6, padding: '3rem' }}>
                        {t('noReclamations')}
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg._id} className="card" style={{
                            borderLeft: `4px solid ${msg.subject === 'reclamation' ? '#f43f5e' : '#3b82f6'}`,
                            opacity: msg.status === 'read' ? 0.7 : 1
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background: msg.subject === 'reclamation' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                        color: msg.subject === 'reclamation' ? '#f43f5e' : '#3b82f6',
                                        textTransform: 'uppercase'
                                    }}>
                                        {getSubjectLabel(msg.subject)}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                                        <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        {new Date(msg.createdAt).toLocaleDateString()}
                                    </span>
                                    {msg.status === 'unread' && (
                                        <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>{t('newBadge')}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {msg.status === 'unread' && (
                                        <button
                                            onClick={() => updateStatus(msg._id, 'read')}
                                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
                                            title={t('markAsRead')}
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteMessage(msg._id)}
                                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                                        title={t('delete')}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{msg.email}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{t('receivedOn')} {new Date(msg.createdAt).toLocaleString()}</div>
                            </div>

                            <p style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6',
                                fontSize: '1rem',
                                background: 'rgba(255,255,255,0.02)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                {msg.message}
                            </p>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <a href={`mailto:${msg.email}?subject=Réponse à votre ${msg.subject === 'reclamation' ? 'réclamation' : 'demande'}`} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                                    {t('replyByEmail')}
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
