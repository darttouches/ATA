'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, ChevronLeft, Wifi, CheckCircle, Star, Eye, Activity } from 'lucide-react';
import Image from 'next/image';

const getAcademicYear = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    return month >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

const groupByYear = (items, dateKey = 'startDate') => {
    const grouped = {};
    items.forEach(item => {
        const date = item[dateKey] || item.createdAt;
        if (!date) return;
        const year = getAcademicYear(date);
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(item);
    });
    return Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(year => ({ year, items: grouped[year] }));
};

const statusBadge = (status) => {
    const map = {
        approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Approuvée' },
        rejected: { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', label: 'Rejetée' },
        pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'En attente' },
    };
    const s = map[status] || map.pending;
    return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: s.bg, color: s.color }}>{s.label}</span>;
};

export default function ClubActivitiesPage() {
    const [loading, setLoading] = useState(true);
    const [actions, setActions] = useState([]);
    const [contents, setContents] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [selected, setSelected] = useState(null); // { type: 'action'|'content', data }
    const [tab, setTab] = useState('actions');

    // NFC scanner state
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error'
    const nfcRef = useRef(null);

    useEffect(() => {
        fetch('/api/member/club-activities')
            .then(r => r.json())
            .then(data => {
                setActions(data.actions || []);
                setContents(data.contents || []);
                setCurrentUserId(data.userId);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const isAuthorizedScanner = (item) => {
        if (!currentUserId || !item.authorizedScanners) return false;
        return item.authorizedScanners.some(s => (s._id || s).toString() === currentUserId);
    };

    const startNFCScan = async (item, type) => {
        setScanMessage('');
        setScanStatus(null);
        if (!('NDEFReader' in window)) {
            setScanMessage('NFC non disponible sur ce navigateur. Utilisez Chrome sur Android.');
            setScanStatus('error');
            return;
        }
        try {
            setShowScanner(true);
            setScanMessage('Approchez un badge NFC...');
            const ndef = new window.NDEFReader();
            nfcRef.current = ndef;
            await ndef.scan();
            ndef.onreading = async ({ message }) => {
                let scannedUserId = null;
                for (const record of message.records) {
                    try {
                        const decoder = new TextDecoder();
                        const text = decoder.decode(record.data);
                        const parsed = JSON.parse(text);
                        scannedUserId = parsed.userId || parsed._id;
                    } catch (e) {
                        // try raw
                        const decoder = new TextDecoder();
                        scannedUserId = decoder.decode(record.data).trim();
                    }
                }
                if (!scannedUserId) {
                    setScanMessage('❌ Tag NFC invalide — aucun ID membre trouvé.');
                    setScanStatus('error');
                    return;
                }

                // Call the appropriate API
                const endpoint = type === 'action'
                    ? `/api/actions/${item._id}/nfc-scan`
                    : '/api/member/club-activities/scan-content';
                const body = type === 'action'
                    ? { scannedUserId }
                    : { contentId: item._id, scannedUserId };

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await res.json();
                setScanMessage(result.message || (result.success ? '✅ Présence enregistrée' : result.error));
                setScanStatus(result.success ? 'success' : 'error');

                if (result.success) {
                    // Refresh local data
                    fetch('/api/member/club-activities')
                        .then(r => r.json())
                        .then(data => {
                            setActions(data.actions || []);
                            setContents(data.contents || []);
                            // update selected too
                            const updatedItem = type === 'action'
                                ? (data.actions || []).find(a => a._id === item._id)
                                : (data.contents || []).find(c => c._id === item._id);
                            if (updatedItem) setSelected({ type, data: updatedItem });
                        });
                    setTimeout(() => setScanMessage('Approchez un autre badge NFC...'), 2000);
                }
            };
        } catch (err) {
            setScanMessage('Erreur NFC : ' + err.message);
            setScanStatus('error');
        }
    };

    const stopNFCScan = () => {
        nfcRef.current = null;
        setShowScanner(false);
        setScanMessage('');
        setScanStatus(null);
    };

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Chargement de vos activités...</div>
    );

    // Detail view
    if (selected) {
        const { type, data } = selected;
        const canScan = isAuthorizedScanner(data);
        const presentList = data.attendees?.filter(a => a.present) || [];

        return (
            <div>
                <button onClick={() => { setSelected(null); stopNFCScan(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <ChevronLeft size={16} /> Retour
                </button>

                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{data.title}</h1>
                            {statusBadge(data.status)}
                        </div>
                        {canScan && (
                            <button
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => { setShowScanner(true); startNFCScan(data, type); }}
                            >
                                <Wifi size={18} /> Scanner NFC
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.7, fontSize: '0.9rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} />
                            {type === 'action' ? new Date(data.startDate).toLocaleDateString('fr-FR') : data.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14} /> {data.localTime || data.time || '—'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Users size={14} /> {presentList.length} présents
                        </span>
                    </div>

                    {data.description && (
                        <div style={{ opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}
                            dangerouslySetInnerHTML={{ __html: data.description }} />
                    )}
                </div>

                {/* NFC Scanner Modal */}
                {showScanner && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div className="card" style={{ maxWidth: '360px', width: '90%', textAlign: 'center', padding: '2rem' }}>
                            <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 12px rgba(99,102,241,0.05)', animation: 'pulse 2s infinite' }}>
                                <Wifi size={36} color="var(--primary)" />
                            </div>
                            <h2 style={{ marginBottom: '0.75rem', fontWeight: 700 }}>Scanner NFC</h2>
                            {scanMessage && (
                                <p style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', background: scanStatus === 'success' ? 'rgba(16,185,129,0.1)' : scanStatus === 'error' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.05)', color: scanStatus === 'success' ? '#10b981' : scanStatus === 'error' ? '#f43f5e' : 'inherit' }}>
                                    {scanMessage}
                                </p>
                            )}
                            <button onClick={stopNFCScan} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                Arrêter le scan
                            </button>
                        </div>
                    </div>
                )}

                {/* Attendees */}
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} color="#10b981" /> Membres présents ({presentList.length})
                    </h2>
                    {presentList.length === 0 ? (
                        <p style={{ opacity: 0.4, fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Aucun membre scanné pour le moment.<br />Utilisez le bouton "Scanner NFC" pour enregistrer les présences.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {presentList.map((att, i) => {
                                const m = att.member;
                                const name = m ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : 'Membre';
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        {m?.profileImage ? (
                                            <Image src={m.profileImage} alt={name} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                {name.charAt(0)}
                                            </div>
                                        )}
                                        <span style={{ fontWeight: 500 }}>{name}</span>
                                        <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto' }} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const groupedActions = groupByYear(actions, 'startDate');
    const groupedContents = groupByYear(contents, 'date');

    const cardItem = (item, type) => (
        <div key={item._id} onClick={() => setSelected({ type, data: item })} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 }}>{item.title}</h3>
                {statusBadge(item.status)}
            </div>
            <div style={{ display: 'flex', gap: '1rem', opacity: 0.6, fontSize: '0.82rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} />{type === 'action' ? new Date(item.startDate).toLocaleDateString('fr-FR') : item.date || '—'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} />{(item.attendees || []).filter(a => a.present).length} présents</span>
                {isAuthorizedScanner(item) && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}><Wifi size={12} />Scanner actif</span>}
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={22} color="var(--primary)" />
                    Activités de mon club
                </h1>
                <p style={{ marginTop: '0.5rem', opacity: 0.6, fontSize: '0.9rem' }}>Retrouvez toutes les actions et événements créés par votre club.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--card-border)', width: 'fit-content' }}>
                {[{ id: 'actions', label: 'Actions', icon: <Star size={14} /> }, { id: 'contents', label: 'Événements & Contenus', icon: <Eye size={14} /> }].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? 'white' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'actions' && (
                <div>
                    {groupedActions.length === 0 ? (
                        <p style={{ opacity: 0.4, textAlign: 'center', padding: '3rem' }}>Aucune action créée par votre club.</p>
                    ) : groupedActions.map(({ year, items }) => (
                        <div key={year} style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.5rem' }}>
                                Saison {year}
                            </h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {items.map(item => cardItem(item, 'action'))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'contents' && (
                <div>
                    {groupedContents.length === 0 ? (
                        <p style={{ opacity: 0.4, textAlign: 'center', padding: '3rem' }}>Aucun événement ou contenu publié par votre club.</p>
                    ) : groupedContents.map(({ year, items }) => (
                        <div key={year} style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.5rem' }}>
                                Saison {year}
                            </h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {items.map(item => cardItem(item, 'content'))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
