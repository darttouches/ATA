'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, User, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ActionDetailsPage({ params }) {
    const { id } = use(params);
    const { t } = useLanguage();
    const router = useRouter();
    const [action, setAction] = useState(null);
    const [loadState, setLoadState] = useState('loading');
    const [members, setMembers] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        if (action) {
            setEditForm({
                title: action.title || '',
                startDate: action.startDate ? new Date(action.startDate).toISOString().split('T')[0] : '',
                localTime: action.localTime || '',
                description: action.description || '',
            });
        }
    }, [action]);

    const handleUpdateDetails = async () => {
        try {
            const res = await fetch(`/api/actions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (data.success) {
                setAction(prev => ({ ...prev, ...data.data }));
                setIsEditing(false);
                alert(t('detailsUpdated'));
            } else {
                alert('Erreur: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert(t('updateError'));
        }
    };

    const [clubs, setClubs] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const actionRes = await fetch(`/api/actions/${id}`);
                const actionData = await actionRes.json();
                if (!actionData.success) throw new Error(actionData.error);
                setAction(actionData.data);

                const initialMap = {};
                if (actionData.data.attendees) {
                    actionData.data.attendees.forEach(att => {
                        if (!att.member) return;
                        const mId = typeof att.member === 'object' ? att.member._id : att.member;
                        initialMap[mId] = {
                            present: att.present,
                            remark: att.remark || ''
                        };
                    });
                }

                // Fetch ALL users and ALL clubs
                const [usersRes, clubsRes] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/clubs')
                ]);
                
                const usersData = await usersRes.json();
                const clubsData = await clubsRes.json();

                if (usersData.success && Array.isArray(usersData.data)) {
                    setMembers(usersData.data);
                    usersData.data.forEach(m => {
                        if (!initialMap[m._id]) {
                            initialMap[m._id] = { present: false, remark: '' };
                        }
                    });
                }
                
                if (Array.isArray(clubsData)) {
                    setClubs(clubsData);
                } else if (clubsData.data && Array.isArray(clubsData.data)) {
                    setClubs(clubsData.data);
                }

                setAttendanceMap(initialMap);
                setLoadState('success');
            } catch (err) {
                console.error(err);
                setLoadState('error');
            }
        };

        if (id) fetchData();
    }, [id]);

    const handleAttendanceChange = (memberId, field, value) => {
        setAttendanceMap(prev => ({
            ...prev,
            [memberId]: {
                ...prev[memberId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            const attendeesArray = Object.keys(attendanceMap).map(mId => ({
                member: mId,
                present: attendanceMap[mId].present,
                remark: attendanceMap[mId].remark
            }));

            const res = await fetch(`/api/actions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendees: attendeesArray
                })
            });

            if (res.ok) {
                alert(t('attendanceUpdated'));
                const updatedActionRes = await fetch(`/api/actions/${id}`);
                const updatedActionData = await updatedActionRes.json();
                if (updatedActionData.success) {
                    setAction(updatedActionData.data);
                }
            } else {
                const errorData = await res.json();
                alert('Erreur: ' + (errorData.error || t('updateError')));
            }
        } catch (error) {
            console.error(error);
            alert(t('serverError'));
        }
    };

    if (loadState === 'loading') return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;
    if (loadState === 'error') return <div className="container" style={{ padding: '2rem' }}>{t('errorLoadingAction')}</div>;
    if (!action) return <div className="container" style={{ padding: '2rem' }}>{t('actionNotFound')}</div>;

    return (
        <div>
            <Link href="/dashboard/my-club/actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                <ChevronLeft size={16} /> {t('back')}
            </Link>

            <header style={{ marginBottom: '2rem', background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                {isEditing ? (
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('actionTitle')}</label>
                            <input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('startDateLabel')}</label>
                                <input type="date" className="input" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('startTimeLabel')}</label>
                                <input type="time" className="input" value={editForm.localTime} onChange={e => setEditForm({ ...editForm, localTime: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('description')}</label>
                            <textarea className="input" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handleUpdateDetails} className="btn btn-primary">{t('save')}</button>
                            <button onClick={() => setIsEditing(false)} className="btn btn-secondary">{t('cancel')}</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{action.title}</h1>
                            <p style={{ opacity: 0.7, margin: '0.5rem 0' }}>{new Date(action.startDate).toLocaleDateString()} {t('at') || 'à'} {action.localTime}</p>
                            <p style={{ fontSize: '0.9rem', maxWidth: '600px', opacity: 0.9 }}>{action.description}</p>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                            {t('edit')}
                        </button>
                    </div>
                )}
            </header>

            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
                    <h3 style={{ fontWeight: 600 }}>{t('attendanceList')}</h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {clubs.map(club => {
                        const clubMembers = members.filter(m => 
                            (m.club?._id?.toString() || m.club?.toString()) === club._id.toString() ||
                            (m.preferredClub?._id?.toString() || m.preferredClub?.toString()) === club._id.toString()
                        );
                        
                        if (clubMembers.length === 0) return null;

                        return (
                            <div key={club._id} style={{ marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.5rem', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
                                    <h4 style={{ color: 'var(--primary)', fontWeight: 700, margin: 0 }}>{club.name}</h4>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                                            <th style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem', opacity: 0.7 }}>{t('member')}</th>
                                            <th style={{ padding: '0.8rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', opacity: 0.7 }}>{t('present')}</th>
                                            <th style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem', opacity: 0.7 }}>{t('remark')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clubMembers.map(member => {
                                            const state = attendanceMap[member._id] || { present: false, remark: '' };
                                            return (
                                                <tr key={member._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                                                            {member.profileImage ? (
                                                                <Image src={member.profileImage} alt="" fill style={{ objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>
                                                                    {(member.firstName || member.name || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{member.firstName} {member.lastName}</span>
                                                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{member.email}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.8rem 1.5rem', textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={state.present}
                                                            onChange={(e) => handleAttendanceChange(member._id, 'present', e.target.checked)}
                                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '0.8rem 1.5rem' }}>
                                                        <input
                                                            type="text"
                                                            value={state.remark}
                                                            onChange={(e) => handleAttendanceChange(member._id, 'remark', e.target.value)}
                                                            placeholder={t('addRemark')}
                                                            className="input"
                                                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: '100%' }}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    {/* Unassigned members */}
                    {members.filter(m => !m.club && !m.preferredClub).length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.5rem', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
                                <h4 style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>Sans Club / Hors Club</h4>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <tbody>
                                    {members.filter(m => !m.club && !m.preferredClub).map(member => {
                                        const state = attendanceMap[member._id] || { present: false, remark: '' };
                                        return (
                                            <tr key={member._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                                                        {member.profileImage ? (
                                                            <Image src={member.profileImage} alt="" fill style={{ objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>
                                                                {(member.firstName || member.name || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{member.firstName} {member.lastName}</span>
                                                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{member.email}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.8rem 1.5rem', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={state.present}
                                                        onChange={(e) => handleAttendanceChange(member._id, 'present', e.target.checked)}
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.8rem 1.5rem' }}>
                                                    <input
                                                        type="text"
                                                        value={state.remark}
                                                        onChange={(e) => handleAttendanceChange(member._id, 'remark', e.target.value)}
                                                        placeholder={t('addRemark')}
                                                        className="input"
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: '100%' }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
                        <Save size={18} /> {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
