'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Wifi, WifiOff, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import RichTextEditor from '@/components/RichTextEditor';

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
    const [currentUser, setCurrentUser] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | success | error
    const [recentScans, setRecentScans] = useState([]); // list of recently scanned members

    useEffect(() => {
        if (action) {
            setEditForm({
                title: action.title || '',
                startDate: action.startDate ? new Date(action.startDate).toISOString().split('T')[0] : '',
                localTime: action.localTime || '',
                description: action.description || '',
                authorizedScanners: action.authorizedScanners || [],
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
                            remark: att.remark || '',
                            memberData: att.member
                        };
                    });
                }

                const [usersRes, clubsRes, currentUserRes] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/clubs'),
                    fetch('/api/user/profile')
                ]);

                if (currentUserRes.ok) {
                    const userData = await currentUserRes.json();
                    setCurrentUser(userData);
                }

                const usersData = await usersRes.json();
                const clubsData = await clubsRes.json();

                if (usersData.success && Array.isArray(usersData.data)) {
                    setMembers(usersData.data);
                    usersData.data.forEach(m => {
                        if (!initialMap[m._id]) {
                            initialMap[m._id] = { present: false, remark: '', memberData: m };
                        } else {
                            // enrich with full member data
                            initialMap[m._id].memberData = m;
                        }
                    });
                }

                if (Array.isArray(clubsData)) {
                    setClubs(clubsData);
                } else if (clubsData.data && Array.isArray(clubsData.data)) {
                    setClubs(clubsData.data);
                }

                setAttendanceMap(initialMap);

                // Build initial recentScans from already-present attendees
                const alreadyPresent = Object.entries(initialMap)
                    .filter(([, v]) => v.present)
                    .map(([k, v]) => ({ memberId: k, memberData: v.memberData, scannedAt: new Date() }));
                setRecentScans(alreadyPresent);

                setLoadState('success');
            } catch (err) {
                console.error(err);
                setLoadState('error');
            }
        };

        if (id) fetchData();
    }, [id]);

    // Mark a member present immediately and save to DB + award 1 point
    const markPresentAndSave = async (memberId) => {
        // Optimistically update UI
        setAttendanceMap(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], present: true }
        }));

        const memberData = members.find(m => m._id === memberId) || attendanceMap[memberId]?.memberData;

        setRecentScans(prev => {
            const already = prev.find(s => s.memberId === memberId);
            if (already) return prev; // already in list
            return [{ memberId, memberData, scannedAt: new Date() }, ...prev];
        });

        // Build full attendees array for save
        const attendeesArray = Object.keys(attendanceMap).map(mId => ({
            member: mId,
            present: mId === memberId ? true : (attendanceMap[mId]?.present || false),
            remark: attendanceMap[mId]?.remark || ''
        }));

        try {
            await fetch(`/api/actions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendees: attendeesArray })
            });
        } catch (err) {
            console.error('Error saving attendance:', err);
        }
    };

    const startNFCScan = async () => {
        if (!('NDEFReader' in window)) {
            setScanStatus('error');
            setScanMessage("NFC non disponible sur ce navigateur. Utilisez Chrome sur Android.");
            return;
        }

        try {
            const ndef = new window.NDEFReader();
            setScanStatus('scanning');
            setScanMessage("Approchez un badge NFC...");
            await ndef.scan();

            ndef.addEventListener("reading", async ({ message, serialNumber }) => {
                let memberIdFound = null;
                for (const record of message.records) {
                    if (record.recordType === "url" || record.recordType === "text") {
                        const decoder = new TextDecoder(record.encoding || 'utf-8');
                        const data = decoder.decode(record.data);
                        const match = data.match(/card\/([a-zA-Z0-9_-]+)/);
                        if (match) memberIdFound = match[1];
                    }
                }

                if (memberIdFound) {
                    const matchedMember = members.find(m => m._id === memberIdFound || m.nfcToken === memberIdFound);
                    if (matchedMember) {
                        // Check if already scanned
                        if (attendanceMap[matchedMember._id]?.present) {
                            setScanStatus('error');
                            setScanMessage(`⚠️ ${matchedMember.firstName} ${matchedMember.lastName} est déjà marqué présent !`);
                        } else {
                            setScanStatus('success');
                            setScanMessage(`✅ ${matchedMember.firstName} ${matchedMember.lastName} — Présence enregistrée ! +1 point`);
                            await markPresentAndSave(matchedMember._id);
                        }
                        // Reset scan status after 2s
                        setTimeout(() => {
                            setScanStatus('scanning');
                            setScanMessage("Approchez un autre badge NFC...");
                        }, 2500);
                    } else {
                        setScanStatus('error');
                        setScanMessage(`❌ Membre non reconnu (Code: ${memberIdFound})`);
                        setTimeout(() => {
                            setScanStatus('scanning');
                            setScanMessage("Approchez un badge NFC...");
                        }, 2500);
                    }
                } else {
                    setScanStatus('error');
                    setScanMessage("❌ Le tag NFC ne contient pas de carte membre valide.");
                    setTimeout(() => {
                        setScanStatus('scanning');
                        setScanMessage("Approchez un badge NFC...");
                    }, 2500);
                }
            });

            ndef.addEventListener("readingerror", () => {
                setScanStatus('error');
                setScanMessage("❌ Erreur de lecture. Réessayez.");
            });
        } catch (error) {
            setScanStatus('error');
            setScanMessage("Erreur d'accès au NFC : " + error.message);
        }
    };

    const stopNFCScan = () => {
        setShowScanner(false);
        setScanMessage('');
        setScanStatus('idle');
    };

    if (loadState === 'loading') return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;
    if (loadState === 'error') return <div className="container" style={{ padding: '2rem' }}>{t('errorLoadingAction')}</div>;
    if (!action) return <div className="container" style={{ padding: '2rem' }}>{t('actionNotFound')}</div>;

    const canScan = currentUser?.role === 'admin' || currentUser?.role === 'national' || (action.authorizedScanners || []).includes(currentUser?._id);
    const presentCount = recentScans.length;
    const totalMembers = members.length;

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
                            <RichTextEditor
                                label={t('description')}
                                value={editForm.description}
                                onChange={(val) => setEditForm({ ...editForm, description: val })}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Membres autorisés à scanner</label>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>Sélectionnez les personnes qui auront le bouton "Scanner NFC" pour cet événement.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                {members.filter(m => m.role === 'admin' || m.role === 'national' || (action && action.club && (m.club?._id === action.club._id || m.club === action.club._id || m.preferredClub?._id === action.club._id))).map(member => (
                                    <label key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={(editForm.authorizedScanners || []).includes(member._id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setEditForm(prev => {
                                                    const list = prev.authorizedScanners || [];
                                                    if (checked) {
                                                        return { ...prev, authorizedScanners: [...list, member._id] };
                                                    } else {
                                                        return { ...prev, authorizedScanners: list.filter(pid => pid !== member._id) };
                                                    }
                                                });
                                            }}
                                            style={{ accentColor: 'var(--primary)' }}
                                        />
                                        {member.firstName} {member.lastName} {member.role === 'national' || member.role === 'admin' ? '(Bureau/Admin)' : ''}
                                    </label>
                                ))}
                            </div>
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
                            <div style={{ fontSize: '0.9rem', maxWidth: '600px', opacity: 0.9 }} dangerouslySetInnerHTML={{ __html: action.description }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {canScan && (
                                <button
                                    onClick={() => { setShowScanner(true); startNFCScan(); }}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', borderColor: '#3b82f6' }}
                                >
                                    <Wifi size={18} /> Scanner NFC
                                </button>
                            )}
                            <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                                {t('edit')}
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{presentCount}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Membres présents</div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{totalMembers}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Total membres</div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                        {totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0}%
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Taux de présence</div>
                </div>
            </div>

            {/* Attendance list — NFC scans only */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontWeight: 600, margin: 0 }}>Liste de Présence</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '0.25rem 0 0' }}>
                            Les membres apparaissent ici automatiquement après le scan de leur badge NFC. Chaque scan ajoute +1 point.
                        </p>
                    </div>
                    {canScan && (
                        <button
                            onClick={() => { setShowScanner(true); startNFCScan(); }}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', borderColor: '#3b82f6', whiteSpace: 'nowrap' }}
                        >
                            <Wifi size={16} /> Scanner NFC
                        </button>
                    )}
                </div>

                {recentScans.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                        <UserCheck size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <p style={{ margin: 0 }}>Aucun badge scanné pour le moment.</p>
                        <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Utilisez le bouton "Scanner NFC" pour enregistrer les présences.</p>
                    </div>
                ) : (
                    <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                            {recentScans.map(({ memberId, memberData }) => {
                                const m = memberData || {};
                                return (
                                    <div key={memberId} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem 1rem', borderRadius: '10px',
                                        background: 'rgba(16, 185, 129, 0.08)',
                                        border: '1px solid rgba(16, 185, 129, 0.25)'
                                    }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                                            {m.profileImage ? (
                                                <Image src={m.profileImage} alt="" fill style={{ objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                                                    {(m.firstName || m.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {m.firstName} {m.lastName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{m.email}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <CheckCircle2 size={20} color="#10b981" />
                                            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>+1 pt</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* NFC Scanner Modal */}
            {showScanner && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '16px', width: '90%', maxWidth: '420px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                        
                        {/* Animated NFC icon */}
                        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem' }}>
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: scanStatus === 'success' ? 'rgba(16,185,129,0.15)' : scanStatus === 'error' ? 'rgba(244,63,94,0.15)' : 'rgba(59,130,246,0.15)',
                                animation: scanStatus === 'scanning' ? 'pulse 1.5s infinite' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {scanStatus === 'success' ? (
                                    <CheckCircle2 size={40} color="#10b981" />
                                ) : scanStatus === 'error' ? (
                                    <AlertCircle size={40} color="#f43f5e" />
                                ) : (
                                    <Wifi size={40} color="#3b82f6" />
                                )}
                            </div>
                        </div>

                        <h2 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Scanner un badge NFC</h2>
                        
                        <div style={{
                            minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '1.5rem', padding: '1rem', borderRadius: '10px',
                            background: scanStatus === 'success' ? 'rgba(16,185,129,0.1)' : scanStatus === 'error' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${scanStatus === 'success' ? 'rgba(16,185,129,0.3)' : scanStatus === 'error' ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.1)'}`
                        }}>
                            <p style={{
                                margin: 0, fontSize: '0.9rem',
                                color: scanStatus === 'success' ? '#10b981' : scanStatus === 'error' ? '#f43f5e' : 'inherit'
                            }}>
                                {scanMessage || "Prêt à scanner..."}
                            </p>
                        </div>

                        {/* Recent scans in modal */}
                        {recentScans.length > 0 && (
                            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>Derniers scans ({recentScans.length}) :</p>
                                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {recentScans.slice(0, 5).map(({ memberId, memberData }) => {
                                        const m = memberData || {};
                                        return (
                                            <div key={memberId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.3rem 0.5rem', borderRadius: '6px', background: 'rgba(16,185,129,0.08)' }}>
                                                <CheckCircle2 size={14} color="#10b981" />
                                                <span>{m.firstName} {m.lastName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <p style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '1.5rem' }}>
                            Approchez simplement la carte au dos du téléphone. (Chrome sur Android requis)
                        </p>
                        <button onClick={stopNFCScan} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                            Terminer le scan
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
