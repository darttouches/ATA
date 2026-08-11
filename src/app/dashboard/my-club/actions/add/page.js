'use client';
import { useState, useEffect } from 'react';
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
        authorizedScanners: [],
    });

    const [eligibleScanners, setEligibleScanners] = useState([]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const userRes = await fetch('/api/user/profile');
                if (userRes.ok) {
                    const userData = await userRes.json();
                    
                    const membersRes = await fetch('/api/users');
                    const membersData = await membersRes.json();
                    
                    if (membersData.success && Array.isArray(membersData.data)) {
                        const allMembers = membersData.data;
                        const filtered = allMembers.filter(m => 
                            m.role === 'admin' || 
                            m.role === 'national' || 
                            (userData.club && (
                                (m.club?._id?.toString() || m.club?.toString()) === (userData.club?._id?.toString() || userData.club?.toString()) || 
                                (m.preferredClub?._id?.toString() || m.preferredClub?.toString()) === (userData.club?._id?.toString() || userData.club?.toString())
                            )) ||
                            // Also if admin/national organizes it, they just see everyone or default
                            // Let's just fallback to allow them if they are national/admin
                            userData.role === 'admin' || userData.role === 'national'
                        );
                        
                        // if admin/national, they can just pick anyone
                        if (userData.role === 'admin' || userData.role === 'national') {
                            setEligibleScanners(allMembers);
                        } else {
                            setEligibleScanners(filtered);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchDetails();
    }, []);

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

                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Membres autorisés à scanner</label>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>Sélectionnez les personnes qui auront accès à l'outil "Scanner NFC" pour cet événement.</p>
                    
                    {eligibleScanners.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Chargement des membres...</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                            {eligibleScanners.map(member => (
                                <label key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.authorizedScanners.includes(member._id)}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setFormData(prev => {
                                                const list = prev.authorizedScanners || [];
                                                if (checked) {
                                                    return { ...prev, authorizedScanners: [...list, member._id] };
                                                } else {
                                                    return { ...prev, authorizedScanners: list.filter(id => id !== member._id) };
                                                }
                                            });
                                        }}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {member.firstName} {member.lastName} {member.role === 'national' || member.role === 'admin' ? '(Bureau/Admin)' : ''}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
                    {loading ? t('creating') : t('createAction')}
                </button>
            </form>
        </div>
    );
}
