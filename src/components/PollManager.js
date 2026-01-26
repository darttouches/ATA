"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, BarChart3, Users, Globe, ChevronDown, ChevronUp, Calendar, EyeOff, Eye } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function PollManager({ isModeration = false }) {
    const { t } = useLanguage();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        question: '',
        description: '',
        options: ['', ''],
        allowMultiple: false,
        visibility: 'public',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        hidden: false
    });

    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        setLoading(true);
        try {
            const endpoint = isModeration ? '/api/admin/polls' : '/api/polls?manage=true';
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setPolls(data);
            }
        } catch (error) {
            console.error('Failed to fetch polls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({
                    question: '',
                    description: '',
                    options: ['', ''],
                    allowMultiple: false,
                    visibility: 'public',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                    hidden: false
                });
                fetchPolls();
            }
        } catch (error) {
            console.error('Failed to create poll:', error);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const res = await fetch('/api/admin/polls', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                fetchPolls();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('confirmDeletePoll'))) return;
        try {
            const res = await fetch(`/api/admin/polls?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchPolls();
        } catch (error) {
            console.error('Failed to delete poll:', error);
        }
    };

    const addOption = () => setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
    const removeOption = (idx) => setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
    const updateOption = (idx, val) => {
        const newOpts = [...formData.options];
        newOpts[idx] = val;
        setFormData(prev => ({ ...prev, options: newOpts }));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle size={16} className="text-primary" />;
            case 'pending': return <Clock size={16} style={{ color: '#f59e0b' }} />;
            case 'rejected': return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
            default: return <Clock size={16} />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved': return t('approved');
            case 'rejected': return t('rejected');
            default: return t('pending');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <div>
                    <h1>{isModeration ? t('pollsModerationTitle') : t('manageMyPolls')}</h1>
                    <p style={{ opacity: 0.6 }}>{isModeration ? t('validatePollsDesc') : t('createPollsDesc')}</p>
                </div>
                {!isModeration && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> {t('createPoll')}
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>{t('loading')}</div>
            ) : polls.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ opacity: 0.5 }}>{t('noPollFound')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {polls.map(poll => (
                        <div key={poll._id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '50px',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {poll.visibility === 'public' ? <Globe size={12} /> : <Users size={12} />}
                                        {poll.visibility === 'public' ? t('public') : t('membersOnlyLabel')}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '50px',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {getStatusIcon(poll.status)}
                                        {getStatusLabel(poll.status)}
                                    </span>
                                </div>
                                {isModeration && (
                                    <button onClick={() => handleDelete(poll._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{poll.question}</h3>
                            <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem', flex: 1 }}>{poll.description}</p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem' }}>{t('options')} ({poll.allowMultiple ? t('multiChoice') : t('singleChoiceLabel')}):</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {poll.options.map((opt, i) => {
                                        const totalVotes = poll.options.reduce((acc, current) => acc + current.votes, 0);
                                        const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                                        return (
                                            <div key={i} style={{ position: 'relative', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    left: 0, top: 0, bottom: 0,
                                                    width: `${percentage}%`,
                                                    background: 'var(--primary)',
                                                    opacity: 0.1,
                                                    transition: 'width 0.5s ease'
                                                }} />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                                    <span style={{ fontSize: '0.85rem' }}>{opt.text}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{opt.votes} ({Math.round(percentage)}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ mt: 'auto', borderTop: '1px solid var(--card-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                    {poll.voters.length} {t('participants')} • {poll.club?.name || t('national')}
                                </div>
                                {isModeration && poll.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.75rem', color: '#ef4444' }} onClick={() => handleStatusUpdate(poll._id, 'rejected')}>{t('reject')}</button>
                                        <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => handleStatusUpdate(poll._id, 'approved')}>{t('approve')}</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>{t('newPoll')}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>{t('question')}</label>
                                <input
                                    className="card"
                                    style={{ width: '100%', background: 'rgba(17, 34, 78, 0.5)', border: '1px solid var(--card-border)', color: 'white' }}
                                    value={formData.question}
                                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="Ex: Quelle activité préférez-vous pour le mois prochain ?"
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>{t('descriptionOptional')}</label>
                                <textarea
                                    className="card"
                                    style={{ width: '100%', background: 'rgba(17, 34, 78, 0.5)', border: '1px solid var(--card-border)', color: 'white', minHeight: '80px' }}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Donnez plus de détails..."
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>{t('options')}</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {formData.options.map((opt, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                className="card"
                                                style={{ flex: 1, background: 'rgba(17, 34, 78, 0.5)', border: '1px solid var(--card-border)', color: 'white' }}
                                                value={opt}
                                                onChange={e => updateOption(i, e.target.value)}
                                                placeholder={`${t('options')} ${i + 1}`}
                                                required
                                            />
                                            {formData.options.length > 2 && (
                                                <button type="button" onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', color: '#ef4444' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={addOption} className="btn btn-secondary" style={{ width: '100%', border: '1px dashed var(--card-border)' }}>
                                        <Plus size={16} /> {t('addOption')}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>{t('targetAudience')}</label>
                                    <select
                                        className="card"
                                        style={{ width: '100%', background: '#11224E', border: '1px solid var(--card-border)', color: 'white' }}
                                        value={formData.visibility}
                                        onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                    >
                                        <option value="public" style={{ background: '#11224E', color: 'white' }}>{t('allVisitors')}</option>
                                        <option value="members" style={{ background: '#11224E', color: 'white' }}>{t('membersOnlyLabel')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>{t('voteType')}</label>
                                    <select
                                        className="card"
                                        style={{ width: '100%', background: '#11224E', border: '1px solid var(--card-border)', color: 'white' }}
                                        value={formData.allowMultiple ? 'multi' : 'single'}
                                        onChange={e => setFormData({ ...formData, allowMultiple: e.target.value === 'multi' })}
                                    >
                                        <option value="single" style={{ background: '#11224E', color: 'white' }}>{t('singleChoiceOption')}</option>
                                        <option value="multi" style={{ background: '#11224E', color: 'white' }}>{t('multiChoiceOption')}</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t('submit')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
