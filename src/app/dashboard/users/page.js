"use client";

import { useState, useEffect, useMemo } from 'react';
import { Trash2, UserCog, ShieldCheck, Download, CheckSquare, Square, CheckCircle2, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/context/LanguageContext';

export default function UsersManagement() {
    const { t, language } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            await fetchCurrentUser();
            await fetchUsers();
        };
        loadData();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (res.ok) setCurrentUser(data);
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchUsers = async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (res.ok) setUsers(data);
        setLoading(false);
    };

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

    // Grouping logic
    const groupedUsers = useMemo(() => {
        const groups = {};
        users.forEach(user => {
            const clubName = user.club?.name || user.preferredClub?.name || t('noClub');
            if (!groups[clubName]) groups[clubName] = [];
            groups[clubName].push(user);
        });
        return groups;
    }, [users, t]);

    // Selection logic
    const toggleSelectAll = (groupName) => {
        const groupUsers = groupedUsers[groupName];
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
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u._id)));
        }
    };

    // Export logic
    const exportToExcel = () => {
        const selectedData = users.filter(u => selectedUsers.has(u._id));
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
            "Payé": u.isPaid ? t('yes') : t('no')
        }));

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");

        // Download the file
        XLSX.writeFile(workbook, `liste_membres_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('usersManagementTitle')}</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={toggleGlobalSelectAll}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.85rem' }}
                    >
                        {selectedUsers.size === users.length ? t('deselectAll') : t('selectAll')}
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

            {Object.entries(groupedUsers).map(([clubName, groupUsers]) => (
                <div key={clubName} style={{ marginBottom: '3rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(124, 58, 237, 0.1)',
                        borderRadius: '8px',
                        borderLeft: '4px solid var(--primary)'
                    }}>
                        <button
                            onClick={() => toggleSelectAll(clubName)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                        >
                            {groupUsers.every(u => selectedUsers.has(u._id)) ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{clubName} ({groupUsers.length})</h2>
                    </div>

                    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', width: '40px' }}></th>
                                    <th style={{ padding: '1rem' }}>{t('member')}</th>
                                    <th style={{ padding: '1rem' }}>Email</th>
                                    <th style={{ padding: '1rem' }}>{t('role')}</th>
                                    <th style={{ padding: '1rem' }}>{t('payment')}</th>
                                    <th style={{ padding: '1rem' }}>{t('phone')}</th>
                                    <th style={{ padding: '1rem' }}>{t('status')}</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupUsers.map(user => {
                                    const isPending = user.status === 'pending';
                                    const isSelected = selectedUsers.has(user._id);
                                    return (
                                        <tr key={user._id} style={{
                                            borderBottom: '1px solid var(--card-border)',
                                            background: isSelected ? 'rgba(124, 58, 237, 0.05)' : (isPending ? 'rgba(124, 58, 237, 0.02)' : 'transparent'),
                                            transition: 'background 0.2s'
                                        }}>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => toggleSelectUser(user._id)}
                                                    style={{ background: 'none', border: 'none', color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 0 }}
                                                >
                                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                                <div style={{ fontSize: '0.9rem' }}>{user.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => updateUser(user._id, { role: e.target.value })}
                                                    disabled={currentUser?.role !== 'admin'}
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
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => updateUser(user._id, { isPaid: !user.isPaid })}
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
                                            <td style={{ padding: '1rem' }}>
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
            ))}
        </div>
    );
}
