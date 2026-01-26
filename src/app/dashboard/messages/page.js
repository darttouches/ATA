"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Search, BadgeCheck, ShieldAlert, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ChatPage() {
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchChatUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser._id);
            // Poll for new messages every 5 seconds
            const interval = setInterval(() => fetchMessages(selectedUser._id, true), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    // Poll for user list updates (unread counts and sorting)
    useEffect(() => {
        const interval = setInterval(() => fetchChatUsers(true), 10000); // Refresh users every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    const fetchMessages = async (userId, isPolling = false) => {
        if (!isPolling) setLoadingMessages(true);
        try {
            const res = await fetch(`/api/chat/messages?recipientId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            if (!isPolling) setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const originalMessage = newMessage;
        setNewMessage('');

        try {
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: selectedUser._id,
                    message: originalMessage
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setNewMessage(originalMessage);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            height: 'calc(100vh - 180px)',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            overflow: 'hidden'
        }}>
            {/* User List Sidebar */}
            <div style={{
                width: '300px',
                borderRight: '1px solid var(--card-border)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
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
                                        {user.role === 'admin' && <ShieldAlert size={12} />}
                                        {user.role === 'president' && <BadgeCheck size={12} />}
                                        {user.role === 'president' ? t('president') : user.role}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(17, 34, 78, 0.1)' }}>
                {selectedUser ? (
                    <>
                        <div style={{ padding: '1rem 2rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: getRoleBadgeColor(selectedUser.role),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    overflow: 'hidden'
                                }}>
                                    {selectedUser.profileImage ? (
                                        <img src={selectedUser.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        selectedUser.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                {isOnline(selectedUser.lastActive) && (
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
                            <div>
                                <div style={{ fontWeight: 700 }}>{selectedUser.name}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{selectedUser.email}</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loadingMessages ? (
                                <p style={{ textAlign: 'center', opacity: 0.5 }}>{t('loading')}</p>
                            ) : messages.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.3, gap: '10px' }}>
                                    <MessageCircle size={48} />
                                    <p>{t('startConversation')} {selectedUser.name}</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const msgIsFromTarget = msg.sender === selectedUser._id;

                                    return (
                                        <div
                                            key={msg._id}
                                            style={{
                                                alignSelf: msgIsFromTarget ? 'flex-start' : 'flex-end',
                                                maxWidth: '70%',
                                                background: msgIsFromTarget ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                                                padding: '10px 15px',
                                                borderRadius: msgIsFromTarget ? '12px 12px 12px 0' : '12px 12px 0 12px',
                                                color: 'white',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.95rem' }}>{msg.message}</div>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.6, textAlign: 'right', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {!msgIsFromTarget && (
                                                    <span style={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
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

                        <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '10px' }}>
                            <input
                                placeholder={t('typeMessage')}
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px 15px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.5, gap: '15px' }}>
                        <div style={{ padding: '2rem', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)' }}>
                            <MessageCircle size={64} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3>{t('internalMessaging')}</h3>
                            <p>{t('selectMemberToChat')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
