"use client";

import { useState, useEffect, useCallback } from 'react';
import { Video, Plus, Calendar, Clock, Trash2, User, Users, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MeetingsHub() {
    const { t, language } = useLanguage();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [canCreate, setCanCreate] = useState(false);
    const [attendeePanel, setAttendeePanel] = useState(null);
    const [now, setNow] = useState(new Date()); // ticks every second
    const router = useRouter();

    const fetchMeetings = useCallback(async () => {
        try {
            const res = await fetch('/api/meetings');
            if (res.ok) {
                const data = await res.json();
                setMeetings(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const checkAuthorization = useCallback(async () => {
        // Fetch current user and settings
        const [meRes, settingsRes] = await Promise.all([
            fetch('/api/user/profile'),
            fetch('/api/admin/settings')
        ]);

        if (meRes.ok && settingsRes.ok) {
            const userData = await meRes.json();
            const settingsData = await settingsRes.json();
            setUser(userData);
            
            const m = settingsData.meetingTA;
            const isAuthorized = userData.role === 'admin' || 
                (m?.isPublished && (m?.authorizedRoles?.includes(userData.role) || 
                m?.authorizedUsers?.includes(userData._id) || 
                m?.authorizedUsers?.includes(userData._id.toString())));
            
            setCanCreate(isAuthorized);
        }
    }, []);

    useEffect(() => {
        checkAuthorization();
        fetchMeetings();
    }, [checkAuthorization, fetchMeetings]);

    const handleDelete = async (id) => {
        if (!confirm(t('confirmDeleteMeeting'))) return;
        try {
            const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMeetings(prev => prev.filter(m => m._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Tick every second for live countdowns
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const showAttendees = async (meeting) => {
        try {
            const res = await fetch(`/api/meetings/${meeting._id}`);
            if (res.ok) {
                const data = await res.json();
                setAttendeePanel({
                    title: meeting.title,
                    members: data.presentMembers || []
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(language === 'ar' ? 'ar-TN' : (language === 'en' ? 'en-US' : 'fr-FR'), {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isJoinable = (meeting) => {
        const start = new Date(meeting.scheduledAt);
        const lateMins = Number(meeting.lateLimitMinutes) || 0;
        const end = new Date(start.getTime() + (lateMins * 60000));
        const bufferStart = new Date(start.getTime() - (15 * 60000));
        return now >= bufferStart && now <= end;
    };

    // Returns seconds remaining in late window, or null if not joinable
    const getLateRemaining = (meeting) => {
        const start = new Date(meeting.scheduledAt);
        const lateMins = Number(meeting.lateLimitMinutes) || 0;
        const end = new Date(start.getTime() + (lateMins * 60000));
        const bufferStart = new Date(start.getTime() - (15 * 60000));
        if (now < bufferStart || now > end) return null;
        return Math.ceil((end - now) / 1000);
    };

    const formatCountdown = (totalSeconds) => {
        if (!totalSeconds || totalSeconds <= 0) return '00:00';
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (loading) return <div className="loading-container">{t('loading')}</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

            {/* Attendee Panel Modal */}
            {attendeePanel && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Présents à la réunion</h3>
                                <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: '0.85rem' }}>{attendeePanel.title}</p>
                            </div>
                            <button onClick={() => setAttendeePanel(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {attendeePanel.members.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                                <Users size={40} style={{ margin: '0 auto 1rem' }} />
                                <p>Aucun membre n'a encore rejoint cette réunion.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {attendeePanel.members.map((entry, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '0.75rem', borderRadius: '10px',
                                        background: 'rgba(124, 58, 237, 0.06)',
                                        border: '1px solid rgba(124, 58, 237, 0.12)'
                                    }}>
                                        {entry.user?.profileImage ? (
                                            <img src={entry.user.profileImage} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                        ) : (
                                            <div style={{
                                                width: 38, height: 38, borderRadius: '50%',
                                                background: 'var(--primary)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem'
                                            }}>
                                                {(entry.user?.firstName || entry.user?.name || '?')[0]}
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {entry.user?.firstName ? `${entry.user.firstName} ${entry.user.lastName}` : (entry.user?.name || 'Membre')}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                                A rejoint à {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem', padding: '2px 8px',
                                            background: '#22c55e22', color: '#22c55e',
                                            borderRadius: '8px', fontWeight: 600
                                        }}>+1 pt</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: 'rgba(124,58,237,0.05)', textAlign: 'center' }}>
                            <strong>{attendeePanel.members.length}</strong> membre{attendeePanel.members.length !== 1 ? 's' : ''} présent{attendeePanel.members.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Video size={32} color="var(--primary)" /> {t('meetingTA')}
                    </h1>
                    <p style={{ opacity: 0.6 }}>{t('manageConferenceCalls') || 'Gérez vos visioconférences et réunions d\'équipe.'}</p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/meetings/create" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> {t('createMeeting')}
                    </Link>
                )}
            </div>

            {meetings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.7 }}>
                    <Video size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <h3>{t('noMeetings')}</h3>
                    <p>{t('noMeetingsDesc') || 'Aucune réunion n\'est prévue pour le moment.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {meetings.map((meeting) => (
                        <div key={meeting._id} className="card meeting-card" style={{ 
                            position: 'relative', 
                            borderLeft: isJoinable(meeting) ? '5px solid #22c55e' : (new Date(meeting.scheduledAt) > new Date() ? '5px solid var(--primary)' : '5px solid #6b7280')
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0 }}>{meeting.title}</h3>
                                        {meeting.status === 'ongoing' && (
                                            <span className="badge-live" style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>LIVE</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>{meeting.description}</p>
                                    
                                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                                            <Calendar size={14} /> {formatDate(meeting.scheduledAt)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                                            <Clock size={14} /> {formatTime(meeting.scheduledAt)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                                            <User size={14} /> {meeting.creator?.firstName || meeting.creator?.name}
                                        </div>
                                    </div>

                                    {/* Live countdown for joinable meetings */}
                                    {isJoinable(meeting) && (() => {
                                        const secs = getLateRemaining(meeting);
                                        if (secs === null) return null;
                                        const isUrgent = secs < 60;
                                        const isWarn = secs < 180;
                                        return (
                                            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>⏱ Temps restant pour le point bonus :</span>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 800,
                                                    fontSize: '1rem',
                                                    padding: '2px 10px',
                                                    borderRadius: '8px',
                                                    background: isUrgent ? 'rgba(239,68,68,0.15)' : isWarn ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.12)',
                                                    color: isUrgent ? '#ef4444' : isWarn ? '#eab308' : '#22c55e',
                                                    border: `1px solid ${isUrgent ? '#ef4444' : isWarn ? '#eab308' : '#22c55e'}44`
                                                }}>
                                                    {formatCountdown(secs)}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                    {(user?._id === meeting.creator?._id || user?.role === 'admin') && (
                                        <>
                                            <button 
                                                onClick={() => showAttendees(meeting)} 
                                                className="btn btn-secondary" 
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                            >
                                                <Users size={16} /> Présents ({meeting.presentMembers?.length || 0})
                                            </button>
                                            <button onClick={() => handleDelete(meeting._id)} className="btn-icon" style={{ color: '#ef4444' }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    )}
                                    
                                    {isJoinable(meeting) ? (
                                        <Link href={`/dashboard/meetings/room/${meeting._id}`} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Video size={18} /> {t('joinMeeting')}
                                        </Link>
                                    ) : (
                                        <button disabled className="btn btn-secondary" style={{ opacity: 0.5 }}>
                                            {new Date(meeting.scheduledAt) > new Date() ? t('upcoming') : t('completed')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .meeting-card {
                    transition: transform 0.2s;
                }
                .meeting-card:hover {
                    transform: translateY(-2px);
                }
                .btn-icon {
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                .btn-icon:hover {
                    background: rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </div>
    );
}
