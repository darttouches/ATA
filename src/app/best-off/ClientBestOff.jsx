"use client";

import { useState } from 'react';
import { Image as ImageIcon, Video, Lightbulb, Play } from 'lucide-react';
import ContentDetailModal from '@/components/ContentDetailModal';

export default function ClientBestOff({ items }) {
    const [selectedItem, setSelectedItem] = useState(null);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video': return <Video size={40} color="rgba(255,255,255,0.1)" />;
            case 'formation': return <Lightbulb size={40} color="rgba(255,255,255,0.1)" />;
            default: return <ImageIcon size={40} color="rgba(255,255,255,0.1)" />;
        }
    };

    return (
        <>
            <div style={{ columns: '3 300px', gap: '1.5rem' }}>
                {items.map((item) => (
                    <div
                        key={item._id}
                        onClick={() => setSelectedItem(item)}
                        style={{
                            breakInside: 'avoid',
                            marginBottom: '1.5rem',
                            background: 'var(--card-bg)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid var(--card-border)',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(17, 34, 78, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            height: 'auto',
                            minHeight: '200px',
                            background: '#11224E',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundImage: item.mediaUrl ? `url(${item.mediaUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative'
                        }}>
                            {!item.mediaUrl && getTypeIcon(item.type)}
                            {item.type === 'video' && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(17, 34, 78, 0.2)' }}>
                                    <Play size={40} color="white" opacity={0.8} />
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem' }}>{item.club?.name}</div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{item.description?.substring(0, 100)}...</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedItem && (
                <ContentDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </>
    );
}
