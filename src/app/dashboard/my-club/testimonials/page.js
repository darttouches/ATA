'use client';
import { useState, useEffect } from 'react';
import { Check, X, Trash2, Star, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function TestimonialsPage() {
    const { t } = useLanguage();
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch('/api/testimonials');
            const data = await res.json();
            if (data.success) {
                setTestimonials(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleApprove = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/testimonials/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approved: !currentStatus })
            });
            if (res.ok) {
                setTestimonials(prev => prev.map(t =>
                    t._id === id ? { ...t, approved: !currentStatus } : t
                ));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('confirmDeleteTestimonial'))) return;
        try {
            const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTestimonials(prev => prev.filter(t => t._id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;

    return (
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem' }}>{t('testimonialsTitle')}</h1>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {testimonials.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '12px' }}>
                        {t('noTestimonials')}
                    </div>
                ) : (
                    testimonials.map(t => (
                        <div key={t._id} style={{
                            background: 'var(--card-bg)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid var(--card-border)',
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < t.rating ? "#fbbf24" : "none"} color={i < t.rating ? "#fbbf24" : "currentColor"} style={{ opacity: i < t.rating ? 1 : 0.2 }} />
                                    ))}
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '0.5rem' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontStyle: 'italic', marginBottom: '1rem', lineHeight: '1.6' }}>"{t.content}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', overflow: 'hidden' }}>
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                            {(t.name || 'A').charAt(0)}
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name || t('anonymous')}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '1px solid var(--card-border)', paddingLeft: '1.5rem' }}>
                                <button
                                    onClick={() => toggleApprove(t._id, t.approved)}
                                    className={`btn ${t.approved ? 'btn-success' : 'btn-secondary'}`}
                                    style={{ width: '100%', justifyContent: 'center', background: t.approved ? 'rgba(34, 197, 94, 0.2)' : '', color: t.approved ? '#22c55e' : '' }}
                                >
                                    {t.approved ? <Check size={18} style={{ marginRight: '5px' }} /> : <X size={18} style={{ marginRight: '5px' }} />}
                                    {t.approved ? t('approvedStatus') : t('waitingStatus')}
                                </button>
                                <button onClick={() => handleDelete(t._id)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', color: '#f43f5e' }}>
                                    <Trash2 size={18} /> {t('delete')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
