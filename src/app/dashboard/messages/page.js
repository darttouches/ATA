"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Search, BadgeCheck, ShieldAlert, MessageCircle, ArrowLeft, Plus, Users, Check, X, Settings, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ChatPage() {
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserList, setShowUserList] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [showEditGroup, setShowEditGroup] = useState(false);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupMembers, setEditGroupMembers] = useState([]);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingMessageText, setEditingMessageText] = useState('');
    const [activeActionMenuId, setActiveActionMenuId] = useState(null);
    const longPressTimer = useRef(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchChatUsers();
        fetchChatGroups();
    }, []);

    const fetchCurrentUser = async () => {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            setSelectedGroup(null);
            fetchMessages({ userId: selectedUser._id });
            const interval = setInterval(() => fetchMessages({ userId: selectedUser._id, isPolling: true }), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (selectedGroup) {
            setSelectedUser(null);
            fetchMessages({ groupId: selectedGroup._id });
            const interval = setInterval(() => fetchMessages({ groupId: selectedGroup._id, isPolling: true }), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedGroup]);

    // Poll for user/group list updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchChatUsers(true);
            fetchChatGroups(true);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const scrollToBottom = (behavior = "smooth") => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior
            });
        }
    };

    const fetchChatUsers = async (isPolling = false) => {
        if (!isPolling) setLoadingUsers(true);
        try {
            const res = await fetch('/api/chat/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            if (!isPolling) setLoadingUsers(false);
        }
    };

    const fetchChatGroups = async (isPolling = false) => {
        try {
            const res = await fetch('/api/chat/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

    const fetchMessages = async ({ userId, groupId, isPolling = false }) => {
        if (!isPolling) setLoadingMessages(true);
        try {
            const url = groupId
                ? `/api/chat/messages?groupId=${groupId}`
                : `/api/chat/messages?recipientId=${userId}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                if (!isPolling) {
                    setTimeout(() => scrollToBottom("auto"), 100);
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            if (!isPolling) setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if ((selectedUser || selectedGroup) && window.innerWidth <= 768) {
            setShowUserList(false);
        }
    }, [selectedUser, selectedGroup]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || (!selectedUser && !selectedGroup)) return;

        const originalMessage = newMessage;
        setNewMessage('');

        try {
            const body = selectedGroup
                ? { groupId: selectedGroup._id, message: originalMessage }
                : { recipientId: selectedUser._id, message: originalMessage };

            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data]);
                setTimeout(() => scrollToBottom("smooth"), 100);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setNewMessage(originalMessage);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedMembers.length === 0) return;

        try {
            const res = await fetch('/api/chat/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newGroupName,
                    members: selectedMembers
                }),
            });
            if (res.ok) {
                const group = await res.json();
                setGroups(prev => [group, ...prev]);
                setShowCreateGroup(false);
                setNewGroupName('');
                setSelectedMembers([]);
                setSelectedGroup(group);
            }
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    const toggleMemberSelection = (userId) => {
        setSelectedMembers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const toggleEditMemberSelection = (userId) => {
        setEditGroupMembers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setEditGroupName(group.name);
        setEditGroupMembers(group.members.map(m => typeof m === 'object' ? m._id : m));
        setShowEditGroup(true);
    };

    const groupUsersByClub = (usersList) => {
        const grouped = {};
        usersList.forEach(user => {
            const clubName = user.club?.name || user.preferredClub?.name || 'Sans Club';
            if (!grouped[clubName]) grouped[clubName] = [];
            grouped[clubName].push(user);
        });
        return grouped;
    };

    const toggleSelectAll = (isEdit = false) => {
        if (isEdit) {
            if (editGroupMembers.length === users.length) {
                setEditGroupMembers([]);
            } else {
                setEditGroupMembers(users.map(u => u._id));
            }
        } else {
            if (selectedMembers.length === users.length) {
                setSelectedMembers([]);
            } else {
                setSelectedMembers(users.map(u => u._id));
            }
        }
    };

    const toggleClubSelection = (clubUsers, isEdit = false) => {
        const clubUserIds = clubUsers.map(u => u._id);
        if (isEdit) {
            const allClubSelected = clubUserIds.every(id => editGroupMembers.includes(id));
            if (allClubSelected) {
                setEditGroupMembers(prev => prev.filter(id => !clubUserIds.includes(id)));
            } else {
                setEditGroupMembers(prev => Array.from(new Set([...prev, ...clubUserIds])));
            }
        } else {
            const allClubSelected = clubUserIds.every(id => selectedMembers.includes(id));
            if (allClubSelected) {
                setSelectedMembers(prev => prev.filter(id => !clubUserIds.includes(id)));
            } else {
                setSelectedMembers(prev => Array.from(new Set([...prev, ...clubUserIds])));
            }
        }
    };

    const usersByClub = groupUsersByClub(users);

    const handleUpdateMessage = async (msgId) => {
        if (!editingMessageText.trim()) return;
        try {
            const res = await fetch(`/api/chat/messages/${msgId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: editingMessageText })
            });
            if (res.ok) {
                const updatedMsg = await res.json();
                setMessages(prev => prev.map(m => m._id === msgId ? updatedMsg : m));
                setEditingMessageId(null);
                setEditingMessageText('');
            }
        } catch (error) {
            console.error('Failed to update message:', error);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        try {
            const res = await fetch(`/api/chat/messages/${msgId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const data = await res.json();
                // data.message contains the updated message object from the server
                const updatedMsg = data.message || data;
                setMessages(prev => prev.map(m => m._id === msgId ? { ...m, ...updatedMsg, isDeleted: true } : m));
                setActiveActionMenuId(null);
                setEditingMessageId(null);
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const handleTouchStart = (msgId) => {
        longPressTimer.current = setTimeout(() => {
            setActiveActionMenuId(msgId);
        }, 600); // 600ms for long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleUpdateGroup = async () => {
        if (!editGroupName.trim() || editGroupMembers.length === 0) return;

        try {
            const res = await fetch(`/api/chat/groups/${editingGroup._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editGroupName,
                    members: editGroupMembers
                }),
            });
            if (res.ok) {
                const updatedGroup = await res.json();
                setGroups(prev => prev.map(g => g._id === updatedGroup._id ? { ...g, ...updatedGroup } : g));
                setSelectedGroup(updatedGroup);
                setShowEditGroup(false);
            } else {
                const data = await res.json();
                alert(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Failed to update group:', error);
            alert('Erreur de connexion');
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action supprimera également tous les messages du groupe.')) return;

        try {
            const res = await fetch(`/api/chat/groups/${groupId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setGroups(prev => prev.filter(g => g._id !== groupId));
                setSelectedGroup(null);
                setShowEditGroup(false);
            } else {
                const data = await res.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Erreur de connexion');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.club?.name || u.preferredClub?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return '#f43f5e';
            case 'president': return 'var(--primary)';
            default: return '#10b981';
        }
    };

    const isOnline = (lastActive) => {
        if (!lastActive) return false;
        const diff = new Date() - new Date(lastActive);
        return diff < 5 * 60 * 1000; // 5 minutes
    };

    return (
        <div style={{
            display: 'flex',
            height: 'calc(100vh - 200px)',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* User List Sidebar */}
            <div style={{
                width: showUserList ? (window.innerWidth <= 768 ? '100%' : '300px') : '0',
                borderRight: showUserList && window.innerWidth > 768 ? '1px solid var(--card-border)' : 'none',
                display: showUserList ? 'flex' : 'none',
                flexDirection: 'column',
                transition: 'width 0.3s ease'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Messages</h2>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'president') && (
                            <button
                                onClick={() => setShowCreateGroup(true)}
                                style={{
                                    background: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                                title="Créer un groupe"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={16} />
                        <input
                            placeholder={t('searchMember')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 35px',
                                background: 'rgba(17, 34, 78, 0.2)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {/* Groups Section */}
                    {groups.length > 0 && (
                        <div style={{ padding: '0.5rem 1rem 0', fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>
                            Groupes
                        </div>
                    )}
                    {groups.map(group => (
                        <div
                            key={group._id}
                            onClick={() => setSelectedGroup(group)}
                            style={{
                                padding: '1rem 1.5rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                background: selectedGroup?._id === group._id ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Users size={20} />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {group.name}
                                    </div>
                                    {group.unreadCount > 0 && (
                                        <div style={{ background: '#f43f5e', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                                            {group.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{group.members?.length} membres</div>
                            </div>
                        </div>
                    ))}

                    {/* Users Section */}
                    {filteredUsers.length > 0 && (
                        <div style={{ padding: '1rem 1rem 0', fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>
                            Membres
                        </div>
                    )}
                    {loadingUsers ? (
                        <p style={{ padding: '1rem', opacity: 0.5 }}>{t('loading')}</p>
                    ) : filteredUsers.length === 0 ? (
                        <p style={{ padding: '1rem', opacity: 0.5, textAlign: 'center' }}>{t('noUserFound')}</p>
                    ) : (
                        filteredUsers.map(user => (
                            <div
                                key={user._id}
                                onClick={() => setSelectedUser(user)}
                                style={{
                                    padding: '1rem 1.5rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                    background: selectedUser?._id === user._id ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                    transition: 'background 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: getRoleBadgeColor(user.role),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 700,
                                        overflow: 'hidden'
                                    }}>
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            user.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {isOnline(user.lastActive) && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            right: '0',
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: '#10b981',
                                            border: '2px solid var(--card-bg)'
                                        }} />
                                    )}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {user.name}
                                        </div>
                                        {user.unreadCount > 0 && (
                                            <div style={{
                                                background: '#f43f5e',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                minWidth: '18px',
                                                textAlign: 'center'
                                            }}>
                                                {user.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {user.club?.name || user.preferredClub?.name || (user.role === 'president' ? t('president') : user.role)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{
                flex: 1,
                display: !showUserList || window.innerWidth > 768 ? 'flex' : 'none',
                flexDirection: 'column',
                background: 'rgba(17, 34, 78, 0.1)'
            }}>
                {selectedUser || selectedGroup ? (
                    <>
                        <div style={{ padding: '1rem 1.5rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button
                                className="mobile-only"
                                onClick={() => setShowUserList(true)}
                                style={{ background: 'none', border: 'none', color: 'white', padding: '5px' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '35px',
                                    height: '35px',
                                    borderRadius: '50%',
                                    background: selectedGroup ? 'var(--primary)' : getRoleBadgeColor(selectedUser.role),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    overflow: 'hidden',
                                    fontSize: '0.8rem',
                                    color: 'white'
                                }}>
                                    {selectedGroup ? (
                                        <Users size={18} />
                                    ) : selectedUser.profileImage ? (
                                        <img src={selectedUser.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        selectedUser.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                {!selectedGroup && isOnline(selectedUser.lastActive) && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        right: '0',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#10b981',
                                        border: '2px solid var(--card-bg)'
                                    }} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedGroup ? selectedGroup.name : selectedUser.name}</div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                                    {selectedGroup ? `${selectedGroup.members?.length} membres` : (selectedUser.club?.name || selectedUser.preferredClub?.name || selectedUser.role)}
                                </div>
                            </div>
                            {selectedGroup && (currentUser?.role === 'admin' || currentUser?.role === 'president' || selectedGroup.admins?.includes(currentUser?._id)) && (
                                <button
                                    onClick={() => handleEditGroup(selectedGroup)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                    title="Gérer le groupe"
                                >
                                    <Settings size={18} />
                                </button>
                            )}
                        </div>

                        <div
                            ref={chatContainerRef}
                            style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loadingMessages ? (
                                <p style={{ textAlign: 'center', opacity: 0.5 }}>{t('loading')}</p>
                            ) : messages.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.3, gap: '10px' }}>
                                    <MessageCircle size={40} />
                                    <p style={{ fontSize: '0.9rem' }}>{t('startConversation')} {selectedGroup ? selectedGroup.name : selectedUser.name}</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                                    const msgIsFromMe = senderId === currentUser?._id;
                                    const sender = users.find(u => u._id === senderId) || (msgIsFromMe ? currentUser : null);

                                    return (
                                        <div
                                            key={`${msg._id}-${msg.isDeleted}`} // Force re-render if deleted status changes
                                            onDoubleClick={() => {
                                                if (msgIsFromMe && !msg.isDeleted) {
                                                    setActiveActionMenuId(activeActionMenuId === msg._id ? null : msg._id);
                                                }
                                            }}
                                            onTouchStart={() => {
                                                if (msgIsFromMe && !msg.isDeleted) {
                                                    handleTouchStart(msg._id);
                                                }
                                            }}
                                            onTouchEnd={handleTouchEnd}
                                            style={{
                                                alignSelf: msgIsFromMe ? 'flex-end' : 'flex-start',
                                                maxWidth: '85%',
                                                background: msgIsFromMe
                                                    ? (msg.isDeleted ? 'rgba(255,255,255,0.05)' : 'var(--primary)')
                                                    : 'rgba(255,255,255,0.05)',
                                                padding: '10px 14px',
                                                borderRadius: msgIsFromMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                color: msgIsFromMe && !msg.isDeleted ? 'white' : 'rgba(255,255,255,0.7)',
                                                position: 'relative',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                                border: msg.isDeleted ? '1px dashed rgba(255,255,255,0.2)' : 'none',
                                                fontStyle: msg.isDeleted ? 'italic' : 'normal',
                                                cursor: (msgIsFromMe && !msg.isDeleted) ? 'pointer' : 'default',
                                                userSelect: 'none',
                                                pointerEvents: msg.isDeleted ? 'none' : 'auto',
                                                opacity: msg.isDeleted ? 0.6 : 1
                                            }}
                                        >
                                            {selectedGroup && !msgIsFromMe && (
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px' }}>
                                                    {sender?.name || 'Membre'}
                                                </div>
                                            )}

                                            {editingMessageId === msg._id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '200px' }}>
                                                    <textarea
                                                        autoFocus
                                                        value={editingMessageText}
                                                        onChange={e => setEditingMessageText(e.target.value)}
                                                        style={{
                                                            background: 'rgba(0,0,0,0.2)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            borderRadius: '4px',
                                                            color: 'white',
                                                            padding: '5px',
                                                            fontSize: '0.9rem',
                                                            resize: 'none',
                                                            minHeight: '60px'
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => setEditingMessageId(null)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.6, fontSize: '0.7rem', cursor: 'pointer' }}>{t('cancel')}</button>
                                                        <button onClick={() => handleUpdateMessage(msg._id)} style={{ background: 'var(--secondary)', border: 'none', borderRadius: '4px', color: 'white', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}>{t('save')}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4', flex: 1 }}>{msg.message}</div>
                                                    {msgIsFromMe && !msg.isDeleted && activeActionMenuId === msg._id && (
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: '20px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingMessageId(msg._id);
                                                                    setEditingMessageText(msg.message);
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                style={{ background: 'none', border: 'none', padding: 0, color: 'white', cursor: 'pointer', display: 'flex' }}
                                                            >
                                                                <Settings size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteMessage(msg._id);
                                                                }}
                                                                style={{ background: 'none', border: 'none', padding: 0, color: '#f43f5e', cursor: 'pointer', display: 'flex' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveActionMenuId(null);
                                                                }}
                                                                style={{ background: 'none', border: 'none', padding: 0, color: 'white', opacity: 0.5, cursor: 'pointer', display: 'flex' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ fontSize: '0.6rem', opacity: 0.5, textAlign: 'right', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                {msg.isEdited && !msg.isDeleted && <span style={{ opacity: 0.7 }}>(modifié)</span>}
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msgIsFromMe && !selectedGroup && !msg.isDeleted && (
                                                    <span style={{ fontWeight: 'bold' }}>
                                                        {msg.isRead ? `• ${t('seen')}` : `• ${t('sent')}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '1rem', background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '8px' }}>
                            <input
                                placeholder={t('typeMessage')}
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '10px 15px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 15px' }}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.5, gap: '15px', padding: '2rem' }}>
                        <div style={{ padding: '2rem', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)' }}>
                            <MessageCircle size={48} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{t('internalMessaging')}</h3>
                            <p style={{ fontSize: '0.9rem' }}>{t('selectMemberToChat')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Créer un groupe</h3>
                            <button onClick={() => setShowCreateGroup(false)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.5 }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px' }}>Nom du groupe</label>
                                <input
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Ex: Conseil d'administration"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Sélectionner les membres ({selectedMembers.length})</label>
                                    <button
                                        onClick={() => toggleSelectAll(false)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {selectedMembers.length === users.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {Object.entries(usersByClub).map(([clubName, clubUsers]) => {
                                        const allClubSelected = clubUsers.every(u => selectedMembers.includes(u._id));
                                        return (
                                            <div key={clubName} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>{clubName}</span>
                                                    <button
                                                        onClick={() => toggleClubSelection(clubUsers, false)}
                                                        style={{ background: 'rgba(124, 58, 237, 0.1)', border: 'none', color: 'var(--primary)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        {allClubSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {clubUsers.map(user => (
                                                        <div
                                                            key={user._id}
                                                            onClick={() => toggleMemberSelection(user._id)}
                                                            style={{
                                                                padding: '8px 10px',
                                                                background: selectedMembers.includes(user._id) ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
                                                                border: '1px solid',
                                                                borderColor: selectedMembers.includes(user._id) ? 'var(--primary)' : 'transparent',
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: getRoleBadgeColor(user.role),
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 700,
                                                                color: 'white'
                                                            }}>
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{user.role}</div>
                                                            </div>
                                                            {selectedMembers.includes(user._id) && <Check size={14} color="var(--primary)" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!newGroupName.trim() || selectedMembers.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    opacity: (!newGroupName.trim() || selectedMembers.length === 0) ? 0.5 : 1
                                }}
                            >
                                Créer le groupe
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Group Modal */}
            {showEditGroup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Gérer le groupe</h3>
                            <button onClick={() => setShowEditGroup(false)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.5 }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px' }}>Nom du groupe</label>
                                <input
                                    value={editGroupName}
                                    onChange={e => setEditGroupName(e.target.value)}
                                    placeholder="Nom du groupe"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Membres ({editGroupMembers.length})</label>
                                    <button
                                        onClick={() => toggleSelectAll(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {editGroupMembers.length === users.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {Object.entries(usersByClub).map(([clubName, clubUsers]) => {
                                        const allClubSelected = clubUsers.every(u => editGroupMembers.includes(u._id));
                                        return (
                                            <div key={clubName} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>{clubName}</span>
                                                    <button
                                                        onClick={() => toggleClubSelection(clubUsers, true)}
                                                        style={{ background: 'rgba(124, 58, 237, 0.1)', border: 'none', color: 'var(--primary)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        {allClubSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {clubUsers.map(user => (
                                                        <div
                                                            key={user._id}
                                                            onClick={() => toggleEditMemberSelection(user._id)}
                                                            style={{
                                                                padding: '8px 10px',
                                                                background: editGroupMembers.includes(user._id) ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
                                                                border: '1px solid',
                                                                borderColor: editGroupMembers.includes(user._id) ? 'var(--primary)' : 'transparent',
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: getRoleBadgeColor(user.role),
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 700,
                                                                color: 'white'
                                                            }}>
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{user.role}</div>
                                                            </div>
                                                            {editGroupMembers.includes(user._id) && <Check size={14} color="var(--primary)" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleDeleteGroup(editingGroup._id)}
                                style={{
                                    padding: '12px',
                                    background: 'rgba(244, 63, 94, 0.1)',
                                    border: '1px solid #f43f5e',
                                    borderRadius: '8px',
                                    color: '#f43f5e',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Supprimer le groupe"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button
                                onClick={handleUpdateGroup}
                                disabled={!editGroupName.trim() || editGroupMembers.length === 0}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    opacity: (!editGroupName.trim() || editGroupMembers.length === 0) ? 0.5 : 1
                                }}
                            >
                                Enregistrer les modifications
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
