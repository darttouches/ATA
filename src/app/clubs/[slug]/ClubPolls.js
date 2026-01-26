"use client";

import { useState, useEffect } from 'react';
import PollWidget from '@/components/PollWidget';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ClubPolls({ clubId }) {
    const { t } = useLanguage();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolls();
    }, [clubId]);

    const fetchPolls = async () => {
        try {
            const res = await fetch(`/api/polls?clubId=${clubId}`);
            if (res.ok) {
                const data = await res.json();
                setPolls(data);
            }
        } catch (error) {
            console.error('Failed to fetch club polls:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;
    if (polls.length === 0) return null;

    return (
        <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <div style={{ padding: '8px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
                    <BarChart3 size={20} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('pollsTitle')}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {polls.map(poll => (
                    <PollWidget key={poll._id} poll={poll} />
                ))}
            </div>
        </section>
    );
}
