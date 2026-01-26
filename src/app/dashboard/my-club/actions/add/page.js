'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function AddActionPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Default form state
    const [formData, setFormData] = useState({
        title: '',
        startDate: '',
        localTime: '',
        description: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                router.push('/dashboard/my-club/actions');
            } else {
                setError(data.error || t('serverError'));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <Link href="/dashboard/my-club/actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                <ChevronLeft size={16} /> {t('back')}
            </Link>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>{t('addAction')}</h1>

            {error && <div style={{ background: '#f43f5e20', color: '#f43f5e', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                    <label>{t('actionTitle')}</label>
                    <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        className="input"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>{t('startDateLabel')}</label>
                        <input
                            type="date"
                            name="startDate"
                            required
                            value={formData.startDate}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('startTimeLabel')}</label>
                        <input
                            type="time"
                            name="localTime"
                            required
                            value={formData.localTime}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>{t('description')}</label>
                    <textarea
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleChange}
                        className="input"
                        rows="4"
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
                    {loading ? t('creating') : t('createAction')}
                </button>
            </form>
        </div>
    );
}
