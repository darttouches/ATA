"use client";

import { useState, useEffect, useMemo } from 'react';
import { Trophy, Search, X, ArrowUp, ArrowDown, UserCog, Shield, Calendar } from 'lucide-react';
import Image from 'next/image';

export default function RankingModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('members'); // 'members' or 'clubs'
    const [users, setUsers] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const getCurrentSeason = () => {
        const now = new Date();
        const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        return `${Math.max(2025, year)}/${Math.max(2025, year) + 1}`;
    };

    const [rankingSeason, setRankingSeason] = useState(getCurrentSeason);
    const [rankingClub, setRankingClub] = useState('all');
    const [rankingSearch, setRankingSearch] = useState('');
    const [rankingSort, setRankingSort] = useState('desc'); // desc or asc
    
    // Sub-modals state
    const [selectedRankingUser, setSelectedRankingUser] = useState(null);
    const [selectedRankingClub, setSelectedRankingClub] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            const seasonParam = rankingSeason ? `&season=${encodeURIComponent(rankingSeason)}` : '';
            const endpoint = activeTab === 'clubs'
                ? `/api/dashboard/ranking?type=clubs${seasonParam}`
                : `/api/dashboard/ranking?type=members${seasonParam}`;
            
            fetch(endpoint)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (activeTab === 'clubs') {
                            setClubs(data.data || []);
                        } else {
                            setUsers(data.data || []);
                        }
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, activeTab, rankingSeason]);

    const allClubs = useMemo(() => {
        const clubSet = new Set();
        users.forEach(u => {
            const cName = u.club?.name || u.preferredClub?.name;
            if(cName) clubSet.add(cName);
        });
        return Array.from(clubSet).sort();
    }, [users]);

    const allSeasons = useMemo(() => {
        const now = new Date();
        const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const minYear = 2025;
        
        const seasons = [
            `${Math.max(minYear, year - 1)}/${Math.max(minYear, year - 1) + 1}`,
            `${Math.max(minYear, year)}/${Math.max(minYear, year) + 1}`,
            `${Math.max(minYear, year + 1)}/${Math.max(minYear, year + 1) + 1}`,
        ];
        
        return [...new Set(seasons)];
    }, []);

    const rankingUsers = useMemo(() => {
        let filtered = users;
        if(rankingClub !== 'all') {
            filtered = filtered.filter(u => {
                const cName = u.club?.name || u.preferredClub?.name;
                return cName === rankingClub;
            });
        }
        if(rankingSearch) {
            const lowSearch = rankingSearch.toLowerCase();
            filtered = filtered.filter(u => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                const userName = (u.name || '').toLowerCase();
                return fullName.includes(lowSearch) || userName.includes(lowSearch);
            });
        }
        filtered.sort((a, b) => {
            const scoreA = a.bonusPoints || 0;
            const scoreB = b.bonusPoints || 0;
            if (rankingSort === 'desc') {
                return scoreB - scoreA;
            } else {
                return scoreA - scoreB;
            }
        });
        return filtered;
    }, [users, rankingClub, rankingSearch, rankingSort]);

    const rankingClubs = useMemo(() => {
        let filtered = [...clubs];
        if (rankingSearch) {
            const lowSearch = rankingSearch.toLowerCase();
            filtered = filtered.filter(c => c.name.toLowerCase().includes(lowSearch));
        }
        filtered.sort((a, b) => {
            if (rankingSort === 'desc') {
                if (b.clubScore !== a.clubScore) return b.clubScore - a.clubScore;
                return b.activeMembersPercent - a.activeMembersPercent;
            } else {
                if (a.clubScore !== b.clubScore) return a.clubScore - b.clubScore;
                return a.activeMembersPercent - b.activeMembersPercent;
            }
        });
        return filtered;
    }, [clubs, rankingSearch, rankingSort]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div className="card" style={{
                background: '#0f172a',
                width: '100%', maxWidth: '850px', maxHeight: '90vh',
                overflowY: 'auto', position: 'relative', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)'
            }} onClick={e => e.stopPropagation()}>
                
                <button 
                    onClick={onClose}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingRight: '40px' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Trophy size={28} color="#f59e0b" />
                        {activeTab === 'members' ? 'Classement des Membres' : 'Classement des Clubs'}
                    </h2>
                </div>

                {/* Tabs selection: Membres vs Clubs */}
                <div style={{
                    display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                    padding: '4px', marginBottom: '1.5rem', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <button
                        onClick={() => setActiveTab('members')}
                        style={{
                            padding: '8px 24px', borderRadius: '8px', border: 'none',
                            fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                            background: activeTab === 'members' ? 'var(--primary, #7c3aed)' : 'transparent',
                            color: 'white', transition: 'all 0.2s'
                        }}
                    >
                        Membres
                    </button>
                    <button
                        onClick={() => setActiveTab('clubs')}
                        style={{
                            padding: '8px 24px', borderRadius: '8px', border: 'none',
                            fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                            background: activeTab === 'clubs' ? 'var(--primary, #7c3aed)' : 'transparent',
                            color: 'white', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <Shield size={16} /> Clubs
                    </button>
                </div>

                {/* Filter Controls */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ flex: '1 1 200px', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', top: '10px', left: '12px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder={activeTab === 'members' ? "Chercher un membre..." : "Chercher un club..."}
                            value={rankingSearch}
                            onChange={(e) => setRankingSearch(e.target.value)}
                            style={{
                                width: '100%', background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', padding: '8px 12px 8px 36px', borderRadius: '8px'
                            }}
                        />
                    </div>
                    
                    {/* Season / Year Filter */}
                    <select
                        value={rankingSeason}
                        onChange={(e) => setRankingSeason(e.target.value)}
                        style={{
                            background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', padding: '8px 12px', borderRadius: '8px'
                        }}
                    >
                        <option value="all">Toutes les saisons</option>
                        {allSeasons.map(s => (
                            <option key={s} value={s}>Saison {s}</option>
                        ))}
                    </select>

                    {activeTab === 'members' && (
                        <select
                            value={rankingClub}
                            onChange={(e) => setRankingClub(e.target.value)}
                            style={{
                                background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', padding: '8px 12px', borderRadius: '8px', maxWidth: '200px'
                            }}
                        >
                            <option value="all">Tous les clubs</option>
                            {allClubs.map(club => (
                                <option key={club} value={club}>{club}</option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => setRankingSort(rankingSort === 'desc' ? 'asc' : 'desc')}
                        style={{
                            background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Trier"
                    >
                        {rankingSort === 'desc' ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>Chargement...</div>
                ) : activeTab === 'members' ? (
                    /* Table for Members */
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                    <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>Rang</th>
                                    <th style={{ padding: '12px 16px' }}>Membre</th>
                                    <th style={{ padding: '12px 16px' }}>Club</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Aucun membre trouvé.</td>
                                    </tr>
                                ) : (
                                    rankingUsers.map((user, index) => (
                                        <tr key={user._id} onClick={() => setSelectedRankingUser(user)} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} className="hover:bg-white/5 transition-colors">
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                {index === 0 && rankingSort === 'desc' ? <Trophy size={18} color="#fbbf24" style={{ margin: '0 auto' }} /> :
                                                 index === 1 && rankingSort === 'desc' ? <Trophy size={18} color="#9ca3af" style={{ margin: '0 auto' }} /> :
                                                 index === 2 && rankingSort === 'desc' ? <Trophy size={18} color="#b45309" style={{ margin: '0 auto' }} /> :
                                                 <span style={{ fontWeight: 600, opacity: 0.8 }}>#{index + 1}</span>}
                                            </td>
                                            <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                    {user.profileImage ? (
                                                        <Image src={user.profileImage} alt="" fill style={{ objectFit: 'cover' }} />
                                                    ) : (
                                                        <UserCog size={16} style={{ opacity: 0.3 }} />
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.name}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                                    {user.club?.name || user.preferredClub?.name || 'Aucun club'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>
                                                {user.bonusPoints || 0} pts
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Table for Clubs */
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                    <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>Rang</th>
                                    <th style={{ padding: '12px 16px' }}>Club</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Contenus Approuvés</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>% Membres Actifs (Score &gt; 0)</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Score Club</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingClubs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Aucun club trouvé.</td>
                                    </tr>
                                ) : (
                                    rankingClubs.map((club, index) => (
                                        <tr 
                                            key={club._id} 
                                            onClick={() => setSelectedRankingClub(club)}
                                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', opacity: club.isActive ? 1 : 0.5, cursor: 'pointer' }}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                {index === 0 && rankingSort === 'desc' ? <Trophy size={18} color="#fbbf24" style={{ margin: '0 auto' }} /> :
                                                 index === 1 && rankingSort === 'desc' ? <Trophy size={18} color="#9ca3af" style={{ margin: '0 auto' }} /> :
                                                 index === 2 && rankingSort === 'desc' ? <Trophy size={18} color="#b45309" style={{ margin: '0 auto' }} /> :
                                                 <span style={{ fontWeight: 600, opacity: 0.8 }}>#{index + 1}</span>}
                                            </td>
                                            <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                    {club.coverImage ? (
                                                        <Image src={club.coverImage} alt="" fill style={{ objectFit: 'cover' }} />
                                                    ) : (
                                                        <Shield size={16} style={{ opacity: 0.3 }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{club.name}</div>
                                                    {!club.isActive && <div style={{ fontSize: '0.7rem', color: '#f43f5e' }}>Club Inactif</div>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>
                                                <span style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                                                    {club.approvedEventsCount} éléments
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {club.activeMembersPercent}% ({club.activeMembersCount}/{club.totalMembers})
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#f59e0b', fontSize: '1rem' }}>
                                                {club.clubScore} pts
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Club Shared Content Sub-modal */}
            {selectedRankingClub && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 4000, padding: '1rem', backdropFilter: 'blur(6px)'
                }} onClick={(e) => { e.stopPropagation(); setSelectedRankingClub(null); }}>
                    <div className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '80vh', overflowY: 'auto', position: 'relative', background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedRankingClub(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                {selectedRankingClub.coverImage ? (
                                    <Image src={selectedRankingClub.coverImage} alt="" fill style={{ objectFit: 'cover' }} />
                                ) : (
                                    <Shield size={22} color="#a78bfa" />
                                )}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                                    {selectedRankingClub.name}
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.6 }}>
                                    Tous les contenus partagés & approuvés ({selectedRankingClub.approvedEventsCount})
                                </p>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                        <th style={{ padding: '12px 16px', width: '40px' }}>#</th>
                                        <th style={{ padding: '12px 16px', width: '130px' }}>Type</th>
                                        <th style={{ padding: '12px 16px' }}>Titre du contenu</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!selectedRankingClub.approvedEvents || selectedRankingClub.approvedEvents.length === 0) ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
                                                Aucun contenu partagé pour cette période.
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedRankingClub.approvedEvents.map((item, idx) => {
                                            const getTypeInfo = (t) => {
                                                switch (t) {
                                                    case 'event': return { label: 'Événement', bg: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa' };
                                                    case 'formation': return { label: 'Formation', bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
                                                    case 'photo': return { label: 'Photos', bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' };
                                                    case 'video': return { label: 'Vidéo', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
                                                    case 'news': return { label: 'Actualité', bg: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' };
                                                    default: return { label: t || 'Contenu', bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' };
                                                }
                                            };
                                            const typeInfo = getTypeInfo(item.type);

                                            return (
                                                <tr key={item._id || idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', opacity: 0.5, fontWeight: 700 }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            background: typeInfo.bg, color: typeInfo.color,
                                                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem',
                                                            fontWeight: 700, display: 'inline-block'
                                                        }}>
                                                            {typeInfo.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', fontSize: '0.92rem', fontWeight: 600 }}>
                                                        {item.title}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                                                        {item.startDate ? new Date(item.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* User Score History Sub-modal */}
            {selectedRankingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 4000, padding: '1rem'
                }} onClick={(e) => { e.stopPropagation(); setSelectedRankingUser(null); }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative', background: '#1e293b' }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedRankingUser(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Trophy size={24} color="#f59e0b" /> Historique ({selectedRankingUser.firstName} {selectedRankingUser.lastName || selectedRankingUser.name})
                        </h2>

                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                        <th style={{ padding: '12px 16px' }}>Date</th>
                                        <th style={{ padding: '12px 16px' }}>Action</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!selectedRankingUser.scoreHistory || selectedRankingUser.scoreHistory.length === 0) ? (
                                        <>
                                            <tr>
                                                <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>—</td>
                                                <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                                                    Score de départ (compte activé)
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>par Système</div>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>+2</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.4, fontStyle: 'italic' }}>
                                                    Les futurs scans NFC et ajustements apparaîtront ici.
                                                </td>
                                            </tr>
                                        </>
                                    ) : (
                                        [...selectedRankingUser.scoreHistory].reverse().map((hist, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                    {new Date(hist.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                                                    {hist.reason}
                                                    {hist.addedBy && <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>par {hist.addedBy}</div>}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: hist.points > 0 ? '#10b981' : '#ef4444' }}>
                                                    {hist.points > 0 ? `+${hist.points}` : hist.points}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
