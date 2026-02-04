"use client";

import React from 'react';
import { Plus, Trash2, Clock, Coffee, Utensils, Info, FileText, Layout, Zap, Moon, Bed, Mic, GraduationCap, Music, Ticket, User, Camera, Upload } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ProgramEditor.module.css';

const ProgramEditor = ({ program, setProgram, globalDuration, setGlobalDuration, partsCount, setPartsCount }) => {
    const { t } = useLanguage();
    const [uploading, setUploading] = React.useState(null); // track index of item uploading

    const addItem = () => {
        const newItem = {
            title: '',
            startTime: '',
            endTime: '',
            duration: '',
            type: 'content',
            description: '',
            speakerName: '',
            speakerPhoto: ''
        };
        setProgram([...program, newItem]);
    };

    const removeItem = (index) => {
        const newProgram = [...program];
        newProgram.splice(index, 1);
        setProgram(newProgram);
    };

    const updateItem = (index, field, value) => {
        const newProgram = [...program];
        newProgram[index][field] = value;

        // Auto-sort if startTime changes
        if (field === 'startTime') {
            newProgram.sort((a, b) => {
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.localeCompare(b.startTime);
            });
        }

        setProgram(newProgram);
    };

    const handleSpeakerPhotoUpload = async (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(index);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, fileData: reader.result, folder: 'speakers' }),
                });
                const data = await res.json();
                if (data.success) {
                    updateItem(index, 'speakerPhoto', data.url);
                }
            } catch (error) {
                console.error('Speaker photo upload failed:', error);
            } finally {
                setUploading(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'content': return <Layout size={18} />;
            case 'pause': return <Zap size={18} />;
            case 'coffee_break': return <Coffee size={18} />;
            case 'breakfast':
            case 'lunch':
            case 'dinner': return <Utensils size={18} />;
            case 'text': return <FileText size={18} />;
            case 'remark': return <Info size={18} />;
            case 'soiree': return <Moon size={18} />;
            case 'sleep': return <Bed size={18} />;
            case 'conference': return <Mic size={18} />;
            case 'formation': return <GraduationCap size={18} />;
            case 'dj_party': return <Music size={18} />;
            case 'ticket': return <Ticket size={18} />;
            default: return <Clock size={18} />;
        }
    };

    return (
        <div className={styles.programContainer}>
            <div className={styles.title}>
                <Clock size={20} />
                {t('manifestationPlan')}
            </div>

            <div className={styles.metaGrid}>
                <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('globalDuration')}</label>
                    <input
                        type="text"
                        className={styles.inputField}
                        value={globalDuration}
                        onChange={(e) => setGlobalDuration(e.target.value)}
                        placeholder="ex: 3h 30min"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('partsCount')}</label>
                    <input
                        type="number"
                        className={styles.inputField}
                        value={partsCount}
                        onChange={(e) => setPartsCount(e.target.value)}
                        placeholder="ex: 4"
                    />
                </div>
            </div>

            <div className={styles.itemList}>
                {program.map((item, index) => (
                    <div key={index} className={styles.itemCard}>
                        <div className={styles.itemHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <div className={styles.iconWrapper} style={{
                                    background: item.type === 'content' ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)',
                                    color: item.type === 'content' ? 'var(--primary)' : 'white'
                                }}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="text"
                                        className={styles.inputField}
                                        style={{ fontWeight: 600, fontSize: '1rem', border: 'none', background: 'transparent' }}
                                        value={item.title}
                                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                                        placeholder={t('title') + " (" + t('optional') + ")"}
                                    />
                                </div>
                            </div>
                            <button type="button" onClick={() => removeItem(index)} className={styles.removeBtn}>
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className={styles.itemInputs}>
                            <select
                                className={styles.typeSelect}
                                value={item.type}
                                onChange={(e) => updateItem(index, 'type', e.target.value)}
                            >
                                <option value="content">{t('content')}</option>
                                <option value="pause">{t('pause')}</option>
                                <option value="coffee_break">{t('coffeeBreak')}</option>
                                <option value="breakfast">{t('breakfast')}</option>
                                <option value="lunch">{t('lunch')}</option>
                                <option value="dinner">{t('dinner')}</option>
                                <option value="soiree">{t('soiree')}</option>
                                <option value="sleep">{t('sleep')}</option>
                                <option value="conference">{t('conference')}</option>
                                <option value="formation">{t('formation')}</option>
                                <option value="dj_party">{t('dj_party')}</option>
                                <option value="spectacle">{t('spectacle')}</option>
                                <option value="text">{t('text')}</option>
                                <option value="remark">{t('remark')}</option>
                            </select>
                            <input
                                type="time"
                                className={styles.inputField}
                                value={item.startTime}
                                onChange={(e) => updateItem(index, 'startTime', e.target.value)}
                                title={t('startTime')}
                            />
                            <input
                                type="time"
                                className={styles.inputField}
                                value={item.endTime}
                                onChange={(e) => updateItem(index, 'endTime', e.target.value)}
                                title={t('endTime')}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <User size={14} style={{ opacity: 0.6 }} />
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    style={{ fontSize: '0.8rem' }}
                                    value={item.speakerName}
                                    onChange={(e) => updateItem(index, 'speakerName', e.target.value)}
                                    placeholder={t('speakerName')}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <label className={styles.uploadBtnMini}>
                                    {uploading === index ? <Clock size={12} className={styles.spin} /> : <Camera size={12} />}
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleSpeakerPhotoUpload(e, index)} />
                                </label>
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    style={{ fontSize: '0.8rem' }}
                                    value={item.speakerPhoto}
                                    onChange={(e) => updateItem(index, 'speakerPhoto', e.target.value)}
                                    placeholder={t('speakerPhoto') + " (URL)"}
                                />
                                {item.speakerPhoto && (
                                    <div className={styles.miniPreview}>
                                        <img src={item.speakerPhoto} alt="speaker" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
                                {t('durationMin')} :
                            </div>
                            <input
                                type="text"
                                className={styles.inputField}
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                value={item.duration}
                                onChange={(e) => updateItem(index, 'duration', e.target.value)}
                                placeholder="ex: 45"
                            />
                        </div>

                        <textarea
                            className={styles.inputField}
                            style={{ marginTop: '10px', minHeight: '60px' }}
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder={t('descriptionOptional')}
                        />
                    </div>
                ))}
            </div>

            <button type="button" className={styles.addBtn} onClick={addItem}>
                <Plus size={20} />
                {t('addItem')}
            </button>
        </div>
    );
};

export default ProgramEditor;
