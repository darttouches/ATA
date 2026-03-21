"use client";
import { useState, useRef, useEffect } from "react";

// PlayerChatPanel is imported and used inside LoupGarouGame board view
export default function PlayerChatPanel({ generalChat, myPrivateMessages, isAlive, sendChat, isMaster, myId }) {
  const [tab, setTab] = useState('general');
  const [msg, setMsg] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim() || !isAlive) return;
    await sendChat(msg.trim(), tab === 'private', 'text');
    setMsg('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [generalChat, myPrivateMessages, tab]);

  const startRecording = async () => {
    if (!isAlive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          await sendChat(reader.result, tab === 'private', 'audio');
          setRecordSeconds(0);
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= 119) { mr.stop(); clearInterval(timerRef.current); setRecording(false); return 120; }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      alert('Microphone inaccessible: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setRecording(false);
    }
  };

  const displayMessages = tab === 'general' ? generalChat : myPrivateMessages;

  const msgStyle = (m) => ({
    padding: '8px 12px', borderRadius: '8px',
    background: m.senderId === myId ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
    alignSelf: m.senderId === myId ? 'flex-end' : 'flex-start',
    maxWidth: '85%', marginBottom: '6px'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderRadius: '10px 10px 0 0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>
        <button onClick={() => setTab('general')}
          style={{ flex: 1, padding: '10px', background: tab === 'general' ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.3)', color: tab === 'general' ? '#a5b4fc' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontWeight: tab === 'general' ? 700 : 400, fontSize: '0.85rem' }}>
          💬 {isMaster ? 'Broadcast général' : 'Chat général'}
        </button>
        <button onClick={() => setTab('private')}
          style={{ flex: 1, padding: '10px', background: tab === 'private' ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.3)', color: tab === 'private' ? '#f87171' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontWeight: tab === 'private' ? 700 : 400, fontSize: '0.85rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          🔒 {isMaster ? 'Messages privés reçus' : 'Message privé au MJ'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)', borderRadius: '0 0 8px 8px', border: '1px solid rgba(255,255,255,0.08)', height: '400px' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' }}>
          {displayMessages.length === 0 && (
            <div style={{ opacity: 0.4, textAlign: 'center', margin: 'auto', fontSize: '0.85rem' }}>Aucun message.</div>
          )}
          {displayMessages.map((m, i) => (
            <div key={i} style={msgStyle(m)}>
              {m.type === 'audio' ? (
                <div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: '3px' }}>🎙️ {m.senderName}</div>
                  <audio controls src={m.message} style={{ maxWidth: '220px', height: '32px' }} />
                </div>
              ) : (
                <div>
                  {isMaster && m.isDirectToMj && <div style={{ fontSize: '0.72rem', color: '#f87171', marginBottom: '2px' }}>De: {m.senderName}</div>}
                  {!isMaster && m.senderId !== myId && <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: '2px' }}>{m.senderName}</div>}
                  <div style={{ fontSize: '0.9rem' }}>{m.message}</div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px' }}>
          {!isAlive ? (
            <div style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.4 }}>💀 Éliminé — chat désactivé</div>
          ) : (
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input value={msg} onChange={e => setMsg(e.target.value)}
                placeholder={tab === 'private' ? (isMaster ? 'Broadcast...' : 'Message privé au MJ...') : 'Message général...'}
                style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.85rem' }}
              />
              {recording ? (
                <button type="button" onClick={stopRecording}
                  style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: 'white', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  ⏹ {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}/2:00
                </button>
              ) : (
                <button type="button" onClick={startRecording}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: 'white', fontSize: '1rem' }}
                  title="Enregistrer un message vocal (max 2 min)">
                  🎙️
                </button>
              )}
              <button type="submit" disabled={!msg.trim()}
                style={{ background: tab === 'private' ? '#ef4444' : '#6366f1', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: 'white', opacity: msg.trim() ? 1 : 0.5 }}>
                ➤
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
