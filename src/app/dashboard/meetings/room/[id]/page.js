"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Video, ShieldAlert, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MeetingRoom() {
    const { id } = useParams();
    const { t } = useLanguage();
    const router = useRouter();
    const [meeting, setMeeting] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pointsAwarded, setPointsAwarded] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [lateCountdown, setLateCountdown] = useState(null);
    const [startAtMs, setStartAtMs] = useState(null); // bufferStart ms for too_early
    const [endAtMs, setEndAtMs] = useState(null);     // end ms for late bonus window

    const fetchDetails = useCallback(async () => {
        try {
            const [meRes, meetingRes] = await Promise.all([
                fetch('/api/user/profile'),
                fetch(`/api/meetings/${id}`)
            ]);

            if (!meRes.ok || !meetingRes.ok) throw new Error('Accès refusé ou réunion introuvable');

            const userData = await meRes.json();
            const meetingData = await meetingRes.json();

            setUser(userData);
            setMeeting(meetingData);

            const now = new Date();
            const start = new Date(meetingData.scheduledAt);
            const lateMins = Number(meetingData.lateLimitMinutes) || 0;
            const end = new Date(start.getTime() + (lateMins * 60000));
            const bufferStart = new Date(start.getTime() - (15 * 60000));

            console.log('[Meeting Debug]', {
                lateLimitMinutes: meetingData.lateLimitMinutes,
                lateMins,
                now: now.toLocaleTimeString(),
                start: start.toLocaleTimeString(),
                end: end.toLocaleTimeString(),
                bufferStart: bufferStart.toLocaleTimeString(),
                tooEarly: now < bufferStart,
                tooLate: now > end,
                joinable: now >= bufferStart && now <= end,
                remainingSeconds: Math.ceil((end - now) / 1000)
            });

            if (now < bufferStart) {
                setError('too_early');
                setStartAtMs(bufferStart.getTime());
                setCountdown(Math.ceil((bufferStart - now) / 1000));
            } else if (now > end) {
                setError('too_late');
            } else {
                // Store end time for the late countdown
                setEndAtMs(end.getTime());
                setLateCountdown(Math.ceil((end - now) / 1000));
                // Award attendance point
                const attendanceRes = await fetch(`/api/meetings/${id}/attendance`, { method: 'POST' });
                if (attendanceRes.ok) {
                    const data = await attendanceRes.json();
                    if (data.pointsAwarded) setPointsAwarded(true);
                }
            }
        } catch (err) {
            setError('access_denied');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    // Countdown for "too_early" — starts once startAtMs is set
    useEffect(() => {
        if (!startAtMs) return;
        const interval = setInterval(() => {
            const remaining = Math.ceil((startAtMs - Date.now()) / 1000);
            if (remaining <= 0) { clearInterval(interval); window.location.reload(); }
            else setCountdown(remaining);
        }, 1000);
        return () => clearInterval(interval);
    }, [startAtMs]);

    // Countdown for late-arrival bonus — starts once endAtMs is set
    useEffect(() => {
        if (!endAtMs) return;
        const interval = setInterval(() => {
            const remaining = Math.ceil((endAtMs - Date.now()) / 1000);
            if (remaining <= 0) { clearInterval(interval); window.location.reload(); }
            else setLateCountdown(remaining);
        }, 1000);
        return () => clearInterval(interval);
    }, [endAtMs]);

    const formatCountdown = (totalSeconds) => {
        if (totalSeconds === null || totalSeconds <= 0) return '00:00';
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (loading) return <div className="loading-container">{t('loading')}</div>;

    if (error === 'too_early') {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }}>
                <Clock size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--primary)' }} />
                <h2>Trop tôt !</h2>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                    La réunion <strong>{meeting?.title}</strong> n'a pas encore débuté.
                </p>

                {/* Dynamic countdown display */}
                <div style={{
                    display: 'inline-block',
                    fontFamily: 'monospace',
                    fontSize: '3.5rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '1rem 2rem',
                    borderRadius: '16px',
                    background: 'rgba(124, 58, 237, 0.1)',
                    border: '2px solid rgba(124, 58, 237, 0.3)',
                    color: 'var(--primary)',
                    marginBottom: '1.5rem',
                    lineHeight: 1
                }}>
                    {formatCountdown(countdown)}
                </div>

                <p style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '2rem' }}>
                    La page s'actualisera automatiquement au démarrage de la réunion.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link href="/dashboard/meetings" className="btn btn-secondary">{t('back')}</Link>
                    <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ opacity: 0.8 }}>
                        Actualiser maintenant
                    </button>
                </div>
            </div>
        );
    }

    if (error === 'too_late') {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }}>
                <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2>Limite de retard dépassée</h2>
                <p>Vous ne pouvez plus rejoindre cette réunion car le délai de présence autorisé est expiré.</p>
                <Link href="/dashboard/meetings" className="btn btn-secondary" style={{ marginTop: '2rem' }}>{t('back')}</Link>
            </div>
        );
    }

    if (error === 'access_denied') {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }}>
                <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2>Accès Refusé</h2>
                <p>Vous n'êtes pas autorisé à rejoindre cette réunion ou elle n'existe plus.</p>
                <Link href="/dashboard/meetings" className="btn btn-secondary" style={{ marginTop: '2rem' }}>{t('back')}</Link>
            </div>
        );
    }

    const displayName = user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.name || 'ATA Member');
    const jitsiUrl = `https://meet.jit.si/${meeting?.roomName || 'ata-general'}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(displayName)}"&userInfo.email="${encodeURIComponent(user?.email || '')}"`;

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link href="/dashboard/meetings" className="btn btn-secondary" style={{ padding: '8px' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{meeting?.title}</h2>
                        {pointsAwarded && (
                            <span style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> +1 point bonus attribué !
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{
                maxWidth: '800px',
                margin: '2rem auto',
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'linear-gradient(135deg, var(--card-bg) 0%, #1e1b4b 100%)',
                border: '1px solid var(--primary)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(124, 58, 237, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    color: 'var(--primary)'
                }}>
                    <Video size={40} />
                </div>

                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Prêt à rejoindre ?</h2>
                <p style={{ opacity: 0.7, maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                    La réunion <strong>{meeting?.title}</strong> est en cours.
                    En cliquant ci-dessous, vous rejoindrez le salon Jitsi officiel de l'ATA dans un nouvel onglet.
                </p>

                {/* Late arrival bonus countdown */}
                {lateCountdown !== null && (
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                            ⏱ Temps restant pour obtenir le point bonus :
                        </p>
                        <div style={{
                            display: 'inline-block',
                            fontFamily: 'monospace',
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            padding: '0.6rem 1.5rem',
                            borderRadius: '12px',
                            background: lateCountdown < 60 ? 'rgba(239,68,68,0.12)' : lateCountdown < 180 ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.1)',
                            border: `2px solid ${lateCountdown < 60 ? '#ef4444' : lateCountdown < 180 ? '#eab308' : '#22c55e'}`,
                            color: lateCountdown < 60 ? '#ef4444' : lateCountdown < 180 ? '#eab308' : '#22c55e',
                            lineHeight: 1
                        }}>
                            {formatCountdown(lateCountdown)}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <a
                        href={jitsiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{
                            padding: '1rem 3rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)'
                        }}
                    >
                        <Video size={22} /> Lancer la Réunion
                    </a>

                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem 1.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: '1px dotted rgba(255,255,255,0.1)',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        maxWidth: '500px'
                    }}>
                        <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} /> Problème de son/micro ?
                        </p>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, opacity: 0.7, listStyle: 'disc' }}>
                            <li style={{ marginBottom: '4px' }}>Vérifiez que votre <strong>onglet de navigateur</strong> n'est pas coupé (clic droit sur l'onglet Jitsi → Réactiver le son).</li>
                            <li style={{ marginBottom: '4px' }}>Dans la réunion Jitsi, cliquez sur la petite flèche à côté du Micro (en bas à gauche) et vérifiez le <strong>Haut-parleur</strong> sélectionné.</li>
                            <li>Assurez-vous que le volume de Windows/macOS n'est pas à zéro.</li>
                        </ul>
                    </div>

                    <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '1rem' }}>
                        Pas de limite de durée • Jusqu'à 100 participants • Sécurisé par Jitsi
                    </p>
                </div>
            </div>
        </div>
    );
}
