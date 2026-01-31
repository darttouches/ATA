"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Search, BadgeCheck, ShieldAlert, MessageCircle, ArrowLeft, Plus, Users, Check, X } from 'lucide-react';
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
    const messagesEndRef = useRef(null);

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
        messagesEndRef.current?.scrollIntoView({ behavior });
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
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedGroup ? selectedGroup.name : selectedUser.name}</div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                                    {selectedGroup ? `${selectedGroup.members?.length} membres` : (selectedUser.club?.name || selectedUser.preferredClub?.name || selectedUser.role)}
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                            key={msg._id}
                                            style={{
                                                alignSelf: msgIsFromMe ? 'flex-end' : 'flex-start',
                                                maxWidth: '85%',
                                                background: msgIsFromMe ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                padding: '10px 14px',
                                                borderRadius: msgIsFromMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                color: 'white',
                                                position: 'relative',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {selectedGroup && !msgIsFromMe && (
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px' }}>
                                                    {sender?.name || 'Membre'}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.message}</div>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.5, textAlign: 'right', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msgIsFromMe && !selectedGroup && (
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
                                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px' }}>Sélectionner les membres ({selectedMembers.length})</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {users.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleMemberSelection(user._id)}
                                            style={{
                                                padding: '10px',
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
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: getRoleBadgeColor(user.role),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'white'
                                            }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{user.role}</div>
                                            </div>
                                            {selectedMembers.includes(user._id) && <Check size={16} color="var(--primary)" />}
                                        </div>
                                    ))}
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
        </div>
    );
}
