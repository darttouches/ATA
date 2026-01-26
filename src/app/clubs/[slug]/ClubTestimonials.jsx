'use client';
import { useState } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function ClubTestimonials({ clubId, initialTestimonials }) {
    const { t, formatDynamicText } = useLanguage();
    const [testimonials, setTestimonials] = useState(initialTestimonials || []);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        rating: 5
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/testimonials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    club: clubId
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessage(t('reviewSuccess'));
                setFormData({ name: '', content: '', rating: 5 });
                setShowForm(false);
            } else {
                setMessage(t('error') + ': ' + data.error);
            }
        } catch (error) {
            setMessage(t('error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section style={{ marginTop: '3rem', borderTop: '1px solid var(--card-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('testimonialsTitle')}</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.9rem' }}
                >
                    <MessageSquare size={16} style={{ marginRight: '8px' }} />
                    {showForm ? t('close') : t('leaveReview')}
                </button>
            </div>

            {message && (
                <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '8px', marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--card-border)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('yourName')}</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('fullName')}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('rating')}</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    <Star
                                        size={24}
                                        fill={star <= formData.rating ? "#fbbf24" : "none"}
                                        color={star <= formData.rating ? "#fbbf24" : "var(--foreground)"}
                                        style={{ opacity: star <= formData.rating ? 1 : 0.3 }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('yourMessage')}</label>
                        <textarea
                            className="input"
                            required
                            rows="3"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            placeholder={t('shareExperience')}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? t('sending') : t('sendReview')}
                    </button>
                </form>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {testimonials.length === 0 ? (
                    <p style={{ opacity: 0.6, fontStyle: 'italic' }}>{t('noReviews')}</p>
                ) : (
                    testimonials.map(t_item => (
                        <div key={t_item._id} style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{(t_item.name || 'A').charAt(0)}</span>
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{t_item.name || t('anonymous')}</span>
                                </div>
                                <div style={{ display: 'flex' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < t_item.rating ? "#fbbf24" : "none"} color={i < t_item.rating ? "#fbbf24" : "var(--foreground)"} style={{ opacity: i < t_item.rating ? 1 : 0.2 }} />
                                    ))}
                                </div>
                            </div>
                            <p style={{ opacity: 0.8, lineHeight: '1.6', fontSize: '0.95rem' }}>{t_item.content}</p>
                            <div style={{ marginTop: '0.8rem', fontSize: '0.75rem', opacity: 0.4 }}>
                                {new Date(t_item.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
