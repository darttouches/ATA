"use client";

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function PollWidget({ poll, onVoted }) {
    const { t } = useLanguage();
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);

    const toggleOption = (idx) => {
        if (poll.allowMultiple) {
            setSelectedIndices(prev =>
                prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
            );
        } else {
            setSelectedIndices([idx]);
        }
    };

    const handleVote = async () => {
        if (selectedIndices.length === 0) return;
        setIsVoting(true);
        setError('');

        try {
            const res = await fetch(`/api/polls/${poll._id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedOptions: selectedIndices }),
            });

            const data = await res.json();
            if (res.ok) {
                setHasVoted(true);
                setShowResults(true);
                if (onVoted) onVoted(data.poll);
            } else {
                setError(data.error || t('voteError'));
            }
        } catch (error) {
            setError(t('voteError'));
        } finally {
            setIsVoting(false);
        }
    };

    // Prepare data for the "creative curve" chart
    const chartData = poll.options.map((opt, i) => ({
        name: opt.text,
        votes: opt.votes,
    }));

    if (showResults) {
        return (
            <div className="card" style={{ padding: '2rem', background: 'rgba(17, 34, 78, 0.4)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{t('resultsLabel')} : {poll.question}</h3>

                <div style={{ height: '280px', width: '100%', marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                contentStyle={{ background: '#11224E', border: '1px solid var(--card-border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#8b5cf6', fontWeight: 700 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="votes"
                                stroke="#a78bfa"
                                fillOpacity={1}
                                fill="url(#colorVotes)"
                                strokeWidth={4}
                                animationDuration={2000}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {poll.options.map((opt, i) => {
                        const total = poll.options.reduce((acc, c) => acc + c.votes, 0);
                        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                        return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.8 }}>
                                <span>{opt.text}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{opt.votes} {t('votesLabel')} ({pct}%)</span>
                            </div>
                        );
                    })}
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.5, marginTop: '1.5rem' }}>
                    {t('thanksParticipation')}
                </p>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{poll.question}</h3>
            {poll.description && <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '1.5rem' }}>{poll.description}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                {poll.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => toggleOption(i)}
                        style={{
                            padding: '12px 15px',
                            borderRadius: '10px',
                            background: selectedIndices.includes(i) ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selectedIndices.includes(i) ? 'var(--primary)' : 'var(--card-border)'}`,
                            color: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>{opt.text}</span>
                        {selectedIndices.includes(i) && <CheckCircle2 size={18} className="text-primary" />}
                    </button>
                ))}
            </div>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <button
                className="btn btn-primary"
                style={{ width: '100%', gap: '10px' }}
                disabled={selectedIndices.length === 0 || isVoting}
                onClick={handleVote}
            >
                {isVoting ? t('votingBtn') : <><Send size={18} /> {t('voteBtn')}</>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.5, marginTop: '1rem' }}>
                {poll.allowMultiple ? t('multipleChoices') : t('singleChoice')} • {poll.visibility === 'members' ? t('membersOnly') : t('openToAll')}
            </p>
        </div>
    );
}
