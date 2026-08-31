"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Trash2, UserCog, ShieldCheck, Download, CheckSquare, Square, CheckCircle2, XCircle, Calendar, Lock, UserPlus, Sparkles, Tag, UserX, Link as LinkIcon, Copy, Trophy, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';

export default function UsersManagement() {
    const { t, language } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedEditUser, setSelectedEditUser] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState('2025/2026');
    const [editFormData, setEditFormData] = useState({
        password: '',
        officialRole: '',
        season: '2025/2026',
        memberNumberDigits: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [copiedUserId, setCopiedUserId] = useState(null);

    // Ranking modal states
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [rankingSeason, setRankingSeason] = useState('2025/2026');
    const [rankingClub, setRankingClub] = useState('all');
    const [rankingSearch, setRankingSearch] = useState('');
    const [rankingSort, setRankingSort] = useState('desc'); // desc or asc
    const [selectedRankingUser, setSelectedRankingUser] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('ranking') === 'true') {
                setShowRankingModal(true);
            }
        }
    }, []);

    // Extract unique clubs and seasons for the filter
    const allClubs = useMemo(() => {
        const clubs = new Set();
        users.forEach(u => {
            const cName = u.club?.name || u.preferredClub?.name;
            if(cName) clubs.add(cName);
        });
        return Array.from(clubs).sort();
    }, [users]);

    const allSeasons = useMemo(() => {
        const seasons = new Set();
        users.forEach(u => {
            if(u.season) seasons.add(u.season);
        });
        if(seasons.size === 0) {
            seasons.add('2025/2026');
            seasons.add('2026/2027');
        }
        return Array.from(seasons).sort((a,b) => b.localeCompare(a));
    }, [users]);

    const rankingUsers = useMemo(() => {
        // Show all members filtered by season — even if deactivated
        // Include approved OR paid members (covers all cases), exclude club accounts
        let filtered = users.filter(u => 
            (u.status === 'approved' || u.isPaid === true) && 
            u.role !== 'club'
        );
        if(rankingSeason) {
            filtered = filtered.filter(u => u.season === rankingSeason);
        }
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
            const scoreA = a.bonusPoints === undefined ? (a.season === '2025/2026' ? 1 : 2) : a.bonusPoints;
            const scoreB = b.bonusPoints === undefined ? (b.season === '2025/2026' ? 1 : 2) : b.bonusPoints;
            if(rankingSort === 'desc') {
                return scoreB - scoreA;
            } else {
                return scoreA - scoreB;
            }
        });
        return filtered;
    }, [users, rankingSeason, rankingClub, rankingSearch, rankingSort]);

    const copyCardLink = (e, userId) => {
        e.stopPropagation();
        const url = `${window.location.origin}/card/${userId}`;

        // Try modern clipboard API first, fallback to execCommand
        const doCopy = () => {
            if (navigator.clipboard && window.isSecureContext) {
                return navigator.clipboard.writeText(url);
            } else {
                // Fallback for HTTP/localhost
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                try {
                    document.execCommand('copy');
                } finally {
                    document.body.removeChild(textarea);
                }
                return Promise.resolve();
            }
        };

        doCopy().then(() => {
            setCopiedUserId(userId);
            setTimeout(() => setCopiedUserId(null), 2500);
        }).catch(() => {
            // Last resort: show the URL
            prompt('Copiez ce lien manuellement :', url);
        });
    };

    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (res.ok) setCurrentUser(data);
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (res.ok) setUsers(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchCurrentUser(), fetchUsers()]);
        };
        loadData();
    }, [fetchCurrentUser, fetchUsers]);

    const updateUser = async (userId, updateData) => {
        // Prevent role update if current user is 'national'
        if (currentUser?.role === 'national' && updateData.role) {
            alert(t('notAuthorizedRoleChange') || "Vous n'êtes pas autorisé à modifier les rôles.");
            return;
        }

        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, ...updateData }),
        });
        if (res.ok) {
            const updated = await res.json();
            setUsers(users.map(u => u._id === userId ? updated : u));
        } else {
            const err = await res.json();
            alert(err.error || t('updateError'));
        }
    };

    const deleteUser = async (userId) => {
        if (confirm(t('confirmDeleteUser'))) {
            const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        }
    };

    const handleSeasonActivity = async (seasonParam, action) => {
        const targetSeason = seasonParam || selectedSeason;
        const isDeactivate = action === 'deactivate';
        const msg = isDeactivate
            ? `Désactiver tous les membres de la saison ${targetSeason} ?\n\nSeule la colonne "Activité" sera modifiée. Statut, cotisation et tous les autres détails restent identiques. Les admins ne sont pas concernés.`
            : `Réactiver tous les membres de la saison ${targetSeason} ?\n\nSeule la colonne "Activité" passera à "Actif" pour les membres approuvés. Aucun autre champ n'est modifié.`;

        if (!confirm(msg)) return;

        try {
            const res = await fetch('/api/admin/users/deactivate-season', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ season: targetSeason, action: isDeactivate ? 'deactivate' : 'activate' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            alert(data.message);
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    // Calculate count per season
    const seasonCounts = useMemo(() => {
        let c2025 = 0;
        let c2026 = 0;
        users.forEach(u => {
            if (u.season === '2026/2027') {
                c2026++;
            } else {
                c2025++;
            }
        });
        return { '2025/2026': c2025, '2026/2027': c2026 };
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {

            if (selectedSeason === '2026/2027') {
                return u.season === '2026/2027';
            } else {
                // Default 2025/2026 includes all existing users (without explicit season or season === '2025/2026')
                return !u.season || u.season === '2025/2026' || u.season !== '2026/2027';
            }
        });
    }, [users, selectedSeason]);

    // Grouping logic based on filtered users for current season
    const groupedUsers = useMemo(() => {
        const groups = {};
        filteredUsers.forEach(user => {
            let clubName = user.club?.name || user.preferredClub?.name;
            if (!clubName) {
                clubName = (user.role === 'admin' || user.role === 'national') ? 'Bureau National & Admin' : t('noClub');
            }
            if (!groups[clubName]) groups[clubName] = [];
            groups[clubName].push(user);
        });
        return groups;
    }, [filteredUsers, t]);

    // Selection logic for filtered users
    const toggleSelectAll = (groupName) => {
        const groupUsers = groupedUsers[groupName] || [];
        const allSelected = groupUsers.every(u => selectedUsers.has(u._id));

        const newSelected = new Set(selectedUsers);
        if (allSelected) {
            groupUsers.forEach(u => newSelected.delete(u._id));
        } else {
            groupUsers.forEach(u => newSelected.add(u._id));
        }
        setSelectedUsers(newSelected);
    };

    const toggleSelectUser = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const toggleGlobalSelectAll = () => {
        if (selectedUsers.size === filteredUsers.length && filteredUsers.length > 0) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
        }
    };

    // Export logic
    const exportToExcel = () => {
        const selectedData = filteredUsers.filter(u => selectedUsers.has(u._id));
        if (selectedData.length === 0) {
            alert(t('selectAtLeastOne'));
            return;
        }

        // Prepare data for Excel with requested columns
        const dataToExport = selectedData.map(u => ({
            "Nom Prénom": u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.name || ""),
            "Email": u.email,
            "Numéro de tel": u.phone || "",
            "Club": u.club?.name || u.preferredClub?.name || t('noClub'),
            "Rôle": u.role,
            "Saison": u.season || '2025/2026',
            "Payé": u.isPaid ? t('yes') : t('no')
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");

        XLSX.writeFile(workbook, `liste_membres_${selectedSeason.replace('/', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{t('usersManagementTitle')}</h1>
                    <p style={{ opacity: 0.7, margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                        Gérez les membres par saison universitaire et par club
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => {
                            setRankingSeason(selectedSeason);
                            setRankingSearch('');
                            setRankingClub('all');
                            setRankingSort('desc');
                            setShowRankingModal(true);
                        }}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
                    >
                        <Trophy size={18} /> Classement
                    </button>
                    <button
                        onClick={toggleGlobalSelectAll}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.85rem' }}
                        disabled={filteredUsers.length === 0}
                    >
                        {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? t('deselectAll') : t('selectAll')}
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                        disabled={selectedUsers.size === 0}
                    >
                        <Download size={18} /> {t('exportExcel')} ({selectedUsers.size})
                    </button>
                </div>
            </div>

            {/* Season Switcher Cards with Deactivate Buttons */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                background: 'rgba(17, 24, 39, 0.6)',
                padding: '12px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                flexWrap: 'wrap'
            }}>
                {/* Saison 2025 / 2026 Card */}
                <div
                    onClick={() => { setSelectedSeason('2025/2026'); setSelectedUsers(new Set()); }}
                    style={{
                        flex: 1,
                        minWidth: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        gap: '14px',
                        padding: '16px 20px',
                        borderRadius: '14px',
                        border: selectedSeason === '2025/2026' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                        background: selectedSeason === '2025/2026'
                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(79, 70, 229, 0.2) 100%)'
                            : 'rgba(255, 255, 255, 0.02)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: selectedSeason === '2025/2026' ? '0 4px 20px rgba(124, 58, 237, 0.35)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                            <div style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: selectedSeason === '2025/2026' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Calendar size={20} color={selectedSeason === '2025/2026' ? '#fff' : 'rgba(255,255,255,0.6)'} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Saison 2025 / 2026
                                </div>
                                <div style={{ fontSize: '0.75rem', color: selectedSeason === '2025/2026' ? '#fca5a5' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Lock size={12} /> Inscriptions fermées (Membres existants)
                                </div>
                            </div>
                        </div>
                        <span style={{
                            background: selectedSeason === '2025/2026' ? 'rgba(124, 58, 237, 0.5)' : 'rgba(255,255,255,0.1)',
                            padding: '4px 14px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 700
                        }}>
                            {seasonCounts['2025/2026']}
                        </span>
                    </div>

                    {currentUser?.role === 'admin' && (
                        <div style={{
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSeasonActivity('2025/2026', 'deactivate'); }}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.78rem',
                                    padding: '6px 14px',
                                    borderColor: 'rgba(244, 63, 94, 0.4)',
                                    color: '#f43f5e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderRadius: '8px',
                                    background: 'rgba(244, 63, 94, 0.12)'
                                }}
                                title="Désactiver tous les membres 2025/2026 (seule la colonne Activité change)"
                            >
                                <UserX size={14} />
                                Désactiver
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSeasonActivity('2025/2026', 'activate'); }}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.78rem',
                                    padding: '6px 14px',
                                    borderColor: 'rgba(34, 197, 94, 0.4)',
                                    color: '#22c55e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderRadius: '8px',
                                    background: 'rgba(34, 197, 94, 0.12)'
                                }}
                                title="Réactiver tous les membres 2025/2026 (seule la colonne Activité change)"
                            >
                                <CheckCircle2 size={14} />
                                Réactiver
                            </button>
                        </div>
                    )}
                </div>

                {/* Saison 2026 / 2027 Card */}
                <div
                    onClick={() => { setSelectedSeason('2026/2027'); setSelectedUsers(new Set()); }}
                    style={{
                        flex: 1,
                        minWidth: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        gap: '14px',
                        padding: '16px 20px',
                        borderRadius: '14px',
                        border: selectedSeason === '2026/2027' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                        background: selectedSeason === '2026/2027'
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                            : 'rgba(255, 255, 255, 0.02)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: selectedSeason === '2026/2027' ? '0 4px 20px rgba(16, 185, 129, 0.35)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                            <div style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: selectedSeason === '2026/2027' ? '#10b981' : 'rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Sparkles size={20} color={selectedSeason === '2026/2027' ? '#fff' : 'rgba(255,255,255,0.6)'} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Saison 2026 / 2027
                                </div>
                                <div style={{ fontSize: '0.75rem', color: selectedSeason === '2026/2027' ? '#6ee7b7' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <UserPlus size={12} /> Nouveaux inscrits
                                </div>
                            </div>
                        </div>
                        <span style={{
                            background: selectedSeason === '2026/2027' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)',
                            padding: '4px 14px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 700
                        }}>
                            {seasonCounts['2026/2027']}
                        </span>
                    </div>

                    {currentUser?.role === 'admin' && (
                        <div style={{
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSeasonActivity('2026/2027', 'deactivate'); }}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.78rem',
                                    padding: '6px 14px',
                                    borderColor: 'rgba(244, 63, 94, 0.4)',
                                    color: '#f43f5e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderRadius: '8px',
                                    background: 'rgba(244, 63, 94, 0.12)'
                                }}
                                title="Désactiver tous les membres 2026/2027 (seule la colonne Activité change)"
                            >
                                <UserX size={14} />
                                Désactiver
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSeasonActivity('2026/2027', 'activate'); }}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.78rem',
                                    padding: '6px 14px',
                                    borderColor: 'rgba(34, 197, 94, 0.4)',
                                    color: '#22c55e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderRadius: '8px',
                                    background: 'rgba(34, 197, 94, 0.12)'
                                }}
                                title="Réactiver tous les membres 2026/2027 (seule la colonne Activité change)"
                            >
                                <CheckCircle2 size={14} />
                                Réactiver
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notice banner for current active season */}
            <div style={{
                marginBottom: '2rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                background: selectedSeason === '2025/2026' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${selectedSeason === '2025/2026' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.9rem'
            }}>
                {selectedSeason === '2025/2026' ? (
                    <>
                        <Lock size={18} color="#ef4444" />
                        <span><strong>Saison 2025/2026 (Fermée) :</strong> Contient la liste des membres déjà inscrits avant cette année. Les nouvelles inscriptions ne sont plus acceptées sous ce bouton.</span>
                    </>
                ) : (
                    <>
                        <Sparkles size={18} color="#10b981" />
                        <span><strong>Saison 2026/2027 (Active) :</strong> Tous les nouveaux inscrits de la nouvelle année sont automatiquement enregistrés sous cette section.</span>
                    </>
                )}
            </div>

            {Object.keys(groupedUsers).length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
                    <Tag size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <p style={{ fontSize: '1.1rem', margin: 0 }}>
                        Aucun utilisateur inscrit pour la saison {selectedSeason}.
                    </p>
                </div>
            ) : (
                Object.entries(groupedUsers).map(([clubName, groupUsers]) => (
                    <div key={clubName} style={{ marginBottom: '3rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1rem',
                            padding: '0.5rem 1rem',
                            background: selectedSeason === '2026/2027' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${selectedSeason === '2026/2027' ? '#10b981' : 'var(--primary)'}`
                        }}>
                            <button
                                onClick={() => toggleSelectAll(clubName)}
                                style={{ background: 'none', border: 'none', color: selectedSeason === '2026/2027' ? '#10b981' : 'var(--primary)', cursor: 'pointer', padding: 0 }}
                            >
                                {groupUsers.every(u => selectedUsers.has(u._id)) ? <CheckSquare size={20} /> : <Square size={20} />}
                            </button>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                                {clubName} ({groupUsers.length})
                            </h2>
                        </div>

                        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem', width: '40px' }}></th>
                                        <th style={{ padding: '1rem' }}>{t('member')}</th>
                                        <th style={{ padding: '1rem' }}>ID Membre</th>
                                        <th style={{ padding: '1rem' }}>Email</th>
                                        <th style={{ padding: '1rem' }}>Saison</th>
                                        <th style={{ padding: '1rem' }}>{t('role')}</th>
                                        <th style={{ padding: '1rem' }}>{t('payment')}</th>
                                        <th style={{ padding: '1rem' }}>{t('phone')}</th>
                                        <th style={{ padding: '1rem' }}>{t('status')}</th>
                                        <th style={{ padding: '1rem' }}>Activite</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Score</th>
                                         <th style={{ padding: '1rem', textAlign: 'center' }}>Carte NFC</th>
                                         <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupUsers.map(user => {
                                        const isPending = user.status === 'pending';
                                        const isSelected = selectedUsers.has(user._id);
                                        const isActive = user.isActive !== false && user.status === 'approved';
                                        return (
                                            <tr key={user._id}
                                                onClick={() => {
                                                    setSelectedEditUser(user);
                                                    setEditFormData({
                                                        password: '',
                                                        officialRole: user.officialRole || '',
                                                        season: user.season || '2025/2026',
                                                        memberNumberDigits: user.memberNumber ? (user.memberNumber.match(/\d+$/) || [])[0] || '' : ''
                                                    });
                                                }}
                                                style={{
                                                    borderBottom: '1px solid var(--card-border)',
                                                    background: isSelected ? 'rgba(124, 58, 237, 0.08)' : (isPending ? 'rgba(124, 58, 237, 0.02)' : 'transparent'),
                                                    transition: 'background 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => toggleSelectUser(user._id)}
                                                        style={{ background: 'none', border: 'none', color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 0 }}
                                                    >
                                                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                                                        {user.profileImage ? (
                                                            <Image src={user.profileImage} alt="" fill style={{ objectFit: 'cover' }} />
                                                        ) : (
                                                            <UserCog size={20} style={{ opacity: 0.3 }} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{t('registeredOn')} {new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                                        {user.role === 'club' ? 'Pas d\'ID' : (user.memberNumber || 'En attente')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{user.email}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontWeight: 600,
                                                        background: (user.season === '2026/2027') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                        color: (user.season === '2026/2027') ? '#34d399' : '#f87171',
                                                        border: `1px solid ${(user.season === '2026/2027') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                                    }}>
                                                        {user.season || '2025/2026'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => updateUser(user._id, { role: e.target.value })}
                                                        disabled={currentUser?.role !== 'admin'}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            background: 'rgba(17, 34, 78, 0.5)',
                                                            color: 'white',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            cursor: currentUser?.role === 'admin' ? 'pointer' : 'not-allowed',
                                                            opacity: currentUser?.role === 'admin' ? 1 : 0.7
                                                        }}
                                                    >
                                                        <option value="membre">{t('member')}</option>
                                                        <option value="president">{t('president')}</option>
                                                        <option value="national">{t('nationalBoardMember')}</option>
                                                        <option value="club">Club</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateUser(user._id, { isPaid: !user.isPaid }); }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            border: '1px solid',
                                                            background: user.isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                            color: user.isPaid ? '#22c55e' : '#f43f5e',
                                                            borderColor: user.isPaid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(244, 63, 94, 0.2)'
                                                        }}
                                                    >
                                                        {user.isPaid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                        {user.isPaid ? t('paid') : t('notPaid')}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <input
                                                        type="text"
                                                        defaultValue={user.phone || ""}
                                                        placeholder={t('phonePlaceholder')}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== user.phone) {
                                                                updateUser(user._id, { phone: e.target.value });
                                                            }
                                                        }}
                                                        style={{
                                                            width: '120px',
                                                            background: 'rgba(17, 34, 78, 0.5)',
                                                            color: 'white',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <select
                                                        value={user.status || 'approved'}
                                                        onChange={(e) => updateUser(user._id, { status: e.target.value })}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            background: user.status === 'pending' ? 'var(--primary)' : 'rgba(17, 34, 78, 0.5)',
                                                            color: 'white',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: user.status === 'pending' ? 600 : 400
                                                        }}
                                                    >
                                                        <option value="pending">{t('pending')}</option>
                                                        <option value="approved">{t('approved')}</option>
                                                        <option value="rejected">{t('rejected')}</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateUser(user._id, { isActive: !isActive }); }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            border: '1px solid',
                                                            background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                            color: isActive ? '#22c55e' : '#f87171',
                                                            borderColor: isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                                                        }}
                                                        title="Cliquer pour basculer l'activité"
                                                    >
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#22c55e' : '#f87171', display: 'inline-block' }}></span>
                                                        {isActive ? 'Actif' : 'Désactivé'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '12px' }}>
                                                        {currentUser?.role === 'admin' && (
                                                            <button 
                                                                onClick={() => updateUser(user._id, { addScore: -1 })}
                                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                                                            >-</button>
                                                        )}
                                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#f59e0b', minWidth: '20px', textAlign: 'center' }}>
                                                            {user.bonusPoints === undefined ? (user.season === '2025/2026' ? 1 : 2) : user.bonusPoints}
                                                        </span>
                                                        {currentUser?.role === 'admin' && (
                                                            <button 
                                                                onClick={() => updateUser(user._id, { addScore: 1 })}
                                                                style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                                                            >+</button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => copyCardLink(e, user._id)}
                                                        title="Copier le lien de la carte membre"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            padding: '5px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            border: '1px solid',
                                                            background: copiedUserId === user._id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                                            color: copiedUserId === user._id ? '#10b981' : '#60a5fa',
                                                            borderColor: copiedUserId === user._id ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.25)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {copiedUserId === user._id ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                                                        {copiedUserId === user._id ? 'Copié !' : 'Lien carte'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => deleteUser(user._id)}
                                                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '5px' }}
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            {/* User Edit Modal */}
            {selectedEditUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justify: 'center', zIndex: 3000, padding: '1rem'
                }} onClick={() => setSelectedEditUser(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserCog size={24} color="var(--primary)" /> {t('userDetails') || 'Détails du membre'}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                                {selectedEditUser.profileImage ? (
                                    <Image src={selectedEditUser.profileImage} alt="" fill style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserCog size={30} style={{ opacity: 0.3 }} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedEditUser.firstName} {selectedEditUser.lastName}</h3>
                                <p style={{ margin: '5px 0', opacity: 0.6, fontSize: '0.9rem' }}>{selectedEditUser.email}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 600 }}>
                                        {selectedEditUser.role}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                        ID: {selectedEditUser.role === 'club' ? 'Pas d\'ID' : (selectedEditUser.memberNumber || 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', fontSize: '0.85rem' }}>
                            <div>
                                <label style={{ opacity: 0.5, display: 'block', marginBottom: '4px' }}>{t('registeredOn')}</label>
                                <div>{new Date(selectedEditUser.createdAt).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR')}</div>
                            </div>
                            <div>
                                <label style={{ opacity: 0.5, display: 'block', marginBottom: '4px' }}>Club</label>
                                <div>{selectedEditUser.club?.name || selectedEditUser.preferredClub?.name || t('noClub')}</div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                                    Saison Universitaire / Adhésion
                                </label>
                                <select
                                    className="card"
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.8)', color: 'white' }}
                                    value={editFormData.season}
                                    onChange={(e) => setEditFormData({ ...editFormData, season: e.target.value })}
                                >
                                    <option value="2025/2026">2025 / 2026 (Inscriptions Fermées)</option>
                                    <option value="2026/2027">2026 / 2027 (Nouveaux Inscrits)</option>
                                </select>
                            </div>

                            {(selectedEditUser.role === 'admin' || selectedEditUser.role === 'national') && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                                        Numéro de Membre Réservé (National/Admin)
                                    </label>
                                    <select
                                        className="card"
                                        style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', background: 'rgba(17, 34, 78, 0.8)', color: 'white' }}
                                        value={editFormData.memberNumberDigits}
                                        onChange={(e) => setEditFormData({ ...editFormData, memberNumberDigits: e.target.value })}
                                    >
                                        <option value="">-- Sélectionner un numéro --</option>
                                        {Array.from({length: 15}, (_, i) => (101380 + i).toString()).filter(num => {
                                            const isUsed = users.some(u => {
                                                if (u._id === selectedEditUser._id) return false;
                                                if (!u.memberNumber) return false;
                                                const digits = (u.memberNumber.match(/\d+$/) || [])[0];
                                                return digits === num;
                                            });
                                            return !isUsed;
                                        }).map(num => (
                                            <option key={num} value={num}>
                                                {((selectedEditUser.firstName || 'A').charAt(0) + (selectedEditUser.lastName || 'A').charAt(0)).toUpperCase()}{num}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                                    {t('positionClub') || 'Position au club'}
                                </label>
                                <input
                                    type="text"
                                    className="card"
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)' }}
                                    placeholder="Ex: Secrétaire Général, Graphiste..."
                                    value={editFormData.officialRole}
                                    onChange={(e) => setEditFormData({ ...editFormData, officialRole: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                                    {t('adminNewPassword') || t('newPassword')}
                                </label>
                                <input
                                    type="text"
                                    className="card"
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)' }}
                                    placeholder={t('leaveToKeepSame')}
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => setSelectedEditUser(null)}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                disabled={isSaving}
                                onClick={async () => {
                                    setIsSaving(true);
                                    const updatePayload = {
                                        officialRole: editFormData.officialRole,
                                        season: editFormData.season,
                                        password: editFormData.password || undefined
                                    };
                                    
                                    if ((selectedEditUser.role === 'admin' || selectedEditUser.role === 'national') && editFormData.memberNumberDigits) {
                                        const fL = (selectedEditUser.firstName || 'A').charAt(0).toUpperCase();
                                        const lL = (selectedEditUser.lastName || 'A').charAt(0).toUpperCase();
                                        updatePayload.memberNumber = `${fL}${lL}${editFormData.memberNumberDigits}`;
                                    }

                                    await updateUser(selectedEditUser._id, updatePayload);
                                    setIsSaving(false);
                                    setSelectedEditUser(null);
                                }}
                            >
                                {isSaving ? t('saving') || 'Enregistrement...' : t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ranking Modal */}
            {showRankingModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justify: 'center', zIndex: 3000, padding: '1rem'
                }} onClick={() => setShowRankingModal(false)}>
                    <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setShowRankingModal(false)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Trophy size={24} color="#f59e0b" /> Classement des Utilisateurs
                        </h2>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px', position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', opacity: 0.5 }} />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={rankingSearch}
                                    onChange={(e) => setRankingSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(17, 34, 78, 0.5)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        padding: '8px 10px 8px 36px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem'
                                    }}
                                />
                            </div>
                            
                            <select
                                value={rankingSeason}
                                onChange={(e) => setRankingSeason(e.target.value)}
                                style={{
                                    flex: '1 1 120px',
                                    background: 'rgba(17, 34, 78, 0.5)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {allSeasons.map(season => (
                                    <option key={season} value={season}>{season}</option>
                                ))}
                            </select>

                            <select
                                value={rankingClub}
                                onChange={(e) => setRankingClub(e.target.value)}
                                style={{
                                    flex: '1 1 150px',
                                    background: 'rgba(17, 34, 78, 0.5)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <option value="all">Tous les clubs</option>
                                {allClubs.map(club => (
                                    <option key={club} value={club}>{club}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setRankingSort(rankingSort === 'desc' ? 'asc' : 'desc')}
                                style={{
                                    background: 'rgba(17, 34, 78, 0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Trier par score"
                            >
                                {rankingSort === 'desc' ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                            </button>
                        </div>

                        {/* Ranking List */}
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
                                                    {user.bonusPoints === undefined ? (user.season === '2025/2026' ? 1 : 2) : user.bonusPoints} pts
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

            {/* User Score History Sub-modal */}
            {selectedRankingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justify: 'center', zIndex: 4000, padding: '1rem'
                }} onClick={() => setSelectedRankingUser(null)}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
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
                                        <tr>
                                            <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Aucun historique enregistré.</td>
                                        </tr>
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
