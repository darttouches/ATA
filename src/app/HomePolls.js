"use client";

import { useState, useEffect } from 'react';
import PollWidget from '@/components/PollWidget';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePolls() {
    const { t } = useLanguage();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        try {
            const res = await fetch('/api/polls');
            if (res.ok) {
                const data = await res.json();
                setPolls(data.filter(p => !p.club));
            }
        } catch (error) {
            console.error('Failed to fetch home polls:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || polls.length === 0) return null;

    return (
        <section style={{ margin: '4rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', justifyContent: 'center' }}>
                <div style={{ padding: '10px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                    <BarChart3 size={24} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{t('pollsTitle')}</h2>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {polls.map(poll => (
                    <PollWidget key={poll._id} poll={poll} />
                ))}
            </div>
        </section>
    );
}
