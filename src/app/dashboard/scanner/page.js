"use client";

import { useState, useEffect, useRef } from 'react';
import { Camera, Users, Download, DownloadCloud, FileText, X, CheckCircle, AlertOctagon, RefreshCw, Lock, ArrowRightLeft, LogIn, LogOut, Settings, Save, FileSpreadsheet, Plus, MapPin, Calendar, Clock, Trash2, ChevronRight, QrCode } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Image from 'next/image';
import Link from 'next/link';

export default function QRScannerPage() {
    const [step, setStep] = useState(0); // 0: Dashboard/List, 1: Setup, 2: Scan
    const [eventsList, setEventsList] = useState([]);
    const [activeEventId, setActiveEventId] = useState(null);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isSavingEvent, setIsSavingEvent] = useState(false);
    
    // Event Configuration
    const [eventDetails, setEventDetails] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        location: '',
        authorizedScanners: ['admin'], // array of authorized roles or user IDs
    });

    // Scanner State
    const [scannedUsers, setScannedUsers] = useState([]);
    const scannedUsersRef = useRef([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [cameras, setCameras] = useState([]);
    const [activeCameraId, setActiveCameraId] = useState(null);
    const html5QrCodeRef = useRef(null);
    const debounceTimerRef = useRef(null);

    const [scanMode, setScanMode] = useState('enter'); // 'enter' | 'exit'

    // Manual Visitor Entry State
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [visitorData, setVisitorData] = useState({ firstName: '', lastName: '', email: '', phone: '' });

    // Members for dropdown
    const [availableMembers, setAvailableMembers] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleScannerToggle = (id, isChecked) => {
        setEventDetails(prev => {
            const currentScanners = Array.isArray(prev.authorizedScanners) ? prev.authorizedScanners : [prev.authorizedScanners];
            if (isChecked) {
                return { ...prev, authorizedScanners: [...currentScanners, id] };
            } else {
                return { ...prev, authorizedScanners: currentScanners.filter(x => x !== id) };
            }
        });
    };

    useEffect(() => {
        // Fetch available cameras
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                setCameras(devices);
                // Prefer back camera if available, otherwise first camera
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('arrière'));
                setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
            }
        }).catch(err => {
            console.error("Erreur de récupération des caméras", err);
        });

        // Fetch members for dropdown
        fetch('/api/dashboard/members')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAvailableMembers(data.data || []);
                }
            })
            .catch(err => console.error("Erreur récupération membres", err));

        return () => {
            stopScan();
        };
    }, []);

    // Fetch Events List for Dashboard
    const fetchEvents = async () => {
        setIsLoadingEvents(true);
        try {
            const res = await fetch('/api/dashboard/scanner');
            const data = await res.json();
            if (data.success) {
                setEventsList(data.data);
            }
        } catch (err) {
            console.error("Failed to load events", err);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    useEffect(() => {
        if (step === 0) {
            fetchEvents();
        }
    }, [step]);

    // Save Data to Server on scan updates
    useEffect(() => {
        if (step === 2 && activeEventId && scannedUsers.length >= 0) {
            const timer = setTimeout(() => {
                fetch(`/api/dashboard/scanner/${activeEventId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scannedUsers })
                }).catch(err => console.error("Failed to sync scanned users", err));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [scannedUsers, step, activeEventId]);

    useEffect(() => {
        scannedUsersRef.current = scannedUsers;
    }, [scannedUsers]);

    const startScan = async () => {
        if (!activeCameraId) {
            setScanResult('error');
            setFeedbackMessage("Aucune caméra sélectionnée.");
            return;
        }

        setScanResult(null);
        setFeedbackMessage('');
        setIsScanning(true);

        setTimeout(() => {
            html5QrCodeRef.current = new Html5Qrcode("reader");
            html5QrCodeRef.current.start(
                activeCameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText, decodedResult) => {
                    // Debounce logic
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                    }
                    debounceTimerRef.current = setTimeout(() => {
                        handleScanResult(decodedText);
                    }, 500); // 500ms debounce
                },
                (errorMessage) => {
                    // Ignore background scan errors
                }
            ).catch((err) => {
                console.error("Erreur de démarrage du scanner:", err);
                setScanResult('error');
                setFeedbackMessage("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
                setIsScanning(false);
            });
        }, 300); // small delay to ensure DOM is ready
    };

    const stopScan = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Erreur à l'arrêt du scanner:", err);
            }
            setIsScanning(false);
        }
    };

    const toggleScanner = () => {
        if (isScanning) {
            stopScan();
        } else {
            startScan();
        }
    };

    const handleScanResult = async (url) => {
        stopScan(); // Stop scanning temporarily to process result

        try {
            let qrid = '';
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                qrid = pathParts[pathParts.length - 1];
            } catch (e) {
                qrid = url;
            }

            if (!qrid || qrid.length < 24) {
                throw new Error("QR Code invalide ou non reconnu.");
            }

            const res = await fetch(`/api/user/card/${qrid}`);
            const data = await res.json();

            if (res.ok && data) {
                const userData = data; // the API returns the user object directly
                const scanTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const userName = userData.firstName ? `${userData.firstName} ${userData.lastName}` : (userData.name || 'Membre');
                const existingUserIndex = scannedUsersRef.current.findIndex(u => u._id === userData._id);
                    
                let isValid = false;
                let feedback = "";
                
                if (existingUserIndex >= 0) {
                    const user = scannedUsersRef.current[existingUserIndex];
                    const history = user.history || [];
                    const latestAction = history.length > 0 ? history[history.length - 1] : null;

                    if (scanMode === 'enter') {
                        if (latestAction && !latestAction.exit) {
                            isValid = false;
                            feedback = `Refusé : ${userName} est déjà entré !`;
                        } else {
                            isValid = true;
                            feedback = `✅ Entrée : ${userName}`;
                        }
                    } else { // scanMode === 'exit'
                        if (!latestAction || latestAction.exit) {
                            isValid = false;
                            feedback = `Refusé : ${userName} n'est pas entré (ou est déjà sorti).`;
                        } else {
                            isValid = true;
                            feedback = `👋 Sortie : ${userName}`;
                        }
                    }
                } else {
                    if (scanMode === 'exit') {
                        isValid = false;
                        feedback = `Refusé : ${userName} n'a jamais été scanné à l'entrée !`;
                    } else {
                        isValid = true;
                        feedback = `✅ Entrée : ${userName}`;
                    }
                }

                if (isValid) {
                    setScanResult('success');
                    setFeedbackMessage(feedback);
                    setScannedUsers(prev => {
                        const idx = prev.findIndex(u => u._id === userData._id);
                        if (idx >= 0) {
                            const updatedList = [...prev];
                            const user = { ...updatedList[idx] };
                            const history = [...(user.history || [])];
                            
                            if (scanMode === 'enter') {
                                history.push({ enter: scanTime, exit: null });
                            } else {
                                history[history.length - 1].exit = scanTime;
                            }
                            user.history = history;
                            updatedList[idx] = user;
                            
                            // Move user to top of the list for visibility
                            const userElement = updatedList.splice(idx, 1)[0];
                            return [userElement, ...updatedList];
                        } else {
                            return [{
                                _id: userData._id,
                                userId: userData._id,
                                name: userName,
                                firstName: userData.firstName || '',
                                lastName: userData.lastName || '',
                                email: userData.email || '',
                                phone: userData.whatsapp || userData.phone || 'Non renseigné',
                                club: userData.club?.name || 'Non rattaché',
                                type: 'Membre',
                                history: [{ enter: scanTime, exit: null }]
                            }, ...prev];
                        }
                    });
                } else {
                    setScanResult('error');
                    setFeedbackMessage(feedback);
                }
            } else {
                const errorData = data || {};
                throw new Error(errorData.error || "Utilisateur non trouvé ou accès refusé.");
            }
        } catch (err) {
            setScanResult('error');
            setFeedbackMessage(err.message || "Erreur de lecture du QR Code.");
        } finally {
            // Auto restart scan after 2 seconds
            setTimeout(startScan, 2000);
        }
    };

    const handleAddVisitor = (e) => {
        e.preventDefault();
        const scanTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setScannedUsers([{
            _id: 'visitor_' + Date.now(),
            firstName: visitorData.firstName,
            lastName: visitorData.lastName,
            name: `${visitorData.firstName} ${visitorData.lastName}`,
            email: visitorData.email || 'N/A',
            phone: visitorData.phone || 'N/A',
            club: 'Visiteur',
            history: [{ enter: scanTime, exit: scanMode === 'exit' ? scanTime : null }]
        }, ...scannedUsers]);
        
        setScanResult('success');
        setFeedbackMessage(`${visitorData.firstName} ajouté(e) en tant que visiteur.`);
        setShowVisitorModal(false);
        setVisitorData({ firstName: '', lastName: '', email: '', phone: '' });
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setIsSavingEvent(true);
        try {
            const res = await fetch('/api/dashboard/scanner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventDetails)
            });
            const data = await res.json();
            if (data.success) {
                setActiveEventId(data.data._id);
                setScannedUsers([]); // new event, empty scan list
                setStep(2);
            } else {
                alert("Erreur: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Erreur de connexion.");
        } finally {
            setIsSavingEvent(false);
        }
    };

    const handleOpenEvent = async (eventId) => {
        const res = await fetch(`/api/dashboard/scanner/${eventId}`);
        const data = await res.json();
        if (data.success) {
            setEventDetails({
                title: data.data.title,
                date: data.data.date,
                time: data.data.time,
                location: data.data.location,
                authorizedScanners: data.data.authorizedScanners || []
            });
            setScannedUsers(data.data.scannedUsers || []);
            setActiveEventId(eventId);
            setStep(2);
        } else {
            alert("Erreur d'ouverture.");
        }
    };

    const handleDeleteEvent = async (eventId, e) => {
        e.stopPropagation();
        if(confirm("Êtes-vous sûr de vouloir supprimer cette manifestation et ses présences ?")) {
            try {
                const res = await fetch(`/api/dashboard/scanner/${eventId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    setEventsList(eventsList.filter(ev => ev._id !== eventId));
                } else {
                    alert("Erreur de suppression");
                }
            } catch (err) {
                console.error(err);
                alert("Erreur réseau");
            }
        }
    };

    const exportToExcel = () => {
        if (scannedUsers.length === 0) return alert("Aucune donnée à exporter.");
        
        const worksheetData = scannedUsers.map((user, index) => ({
            'N°': index + 1,
            'Nom et Prénom': `${user.firstName} ${user.lastName}`.trim(),
            'Email': user.email,
            'Numéro / WhatsApp': user.phone,
            Club: user.club,
            Historique: user.history 
                ? user.history.map((h, i) => `[${i+1}] Entrée: ${h.enter} - Sortie: ${h.exit || 'Active'}`).join(' | ') 
                : "Manuel"
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, "Présences");
        
        const fileName = `Presences_${eventDetails.title.replace(/\s+/g, '_')}_${eventDetails.date}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const exportToPDF = () => {
        if (scannedUsers.length === 0) return alert("Aucune donnée à exporter.");

        const doc = new jsPDF('landscape');
        
        // Header
        doc.setFontSize(18);
        doc.text(`Liste de Présence - ${eventDetails.title || 'Manifestation'}`, 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Date : ${eventDetails.date}`, 14, 28);
        doc.text(`Lieu : ${eventDetails.location || 'Non spécifié'}`, 14, 34);
        doc.text(`Total Scanné(s) : ${scannedUsers.length} personne(s)`, 14, 40);
        doc.text(`Heure : ${eventDetails.time}`, 14, 46);

        // Table
        const tableColumn = ["Nom", "Email", "Téléphone", "Club", "Historique (E/S)"];
        const tableRows = [];

        scannedUsers.forEach(user => {
            const historyStr = user.history 
                ? user.history.map(h => `${h.enter} -> ${h.exit || '...'}`).join('\n') 
                : "Manuel";
            const rowData = [
                user.name,
                user.email,
                user.phone,
                user.club,
                historyStr
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            startY: 55, // Adjusted startY to accommodate new header lines
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] }
        });

        doc.save(`Presences_${eventDetails.title.replace(/\s+/g, '_')}_${eventDetails.date}.pdf`);
    };

    if (step === 0) {
        return (
            <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                                <QrCode className="w-8 h-8 text-blue-600" />
                                Gestion des Scanners
                            </h1>
                            <p className="text-gray-500 mt-1">Gérez vos manifestations et pointez les présences.</p>
                        </div>
                        <button onClick={() => setStep(1)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:-translate-y-1">
                            <Plus className="w-5 h-5" /> Nouvelle Manifestation
                        </button>
                    </div>

                    {isLoadingEvents ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : eventsList.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10 text-blue-300" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune Manifestation</h2>
                            <p className="text-gray-500 mb-6 max-w-sm">Vous n'avez pas encore créé de manifestation pour le scan des membres.</p>
                            <button onClick={() => setStep(1)} className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all">
                                <Plus className="w-5 h-5" /> Créer
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {eventsList.map(event => (
                                <div key={event._id} onClick={() => handleOpenEvent(event._id)} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                            <Calendar className="w-6 h-6 text-indigo-500 group-hover:text-white" />
                                        </div>
                                        <button onClick={(e) => handleDeleteEvent(event._id, e)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{event.title}</h3>
                                    <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" /> {event.location || 'Lieu non spécifié'}
                                    </p>
                                    
                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{event.date}</span>
                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                                                <Users className="w-4 h-4 text-emerald-500" /> {event.scannedUsers?.length || 0} personnes
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors text-gray-400 group-hover:text-blue-600">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (step === 1) {
        return (
            <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-[#0f172a] to-black p-4 lg:p-8 relative overflow-hidden flex items-center justify-center">
                {/* Decorative blurred blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="w-full max-w-2xl bg-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden relative z-10 transition-all duration-500 hover:shadow-blue-500/10">
                    <div className="p-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 opacity-50 z-0"></div>
                        <Camera className="w-20 h-20 text-blue-400 mx-auto mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight relative z-10">Scanner d'Évènements</h1>
                        <p className="text-blue-200/80 font-medium relative z-10">Configurez votre manifestation avant de commencer le check-in</p>
                    </div>
                    
                    <form className="p-8 space-y-6 lg:p-10" onSubmit={handleCreateEvent}>
                        <div className="space-y-6">
                            <div className="group">
                                <label className="flex items-center text-sm font-bold text-white mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30">
                                        <Settings className="w-4 h-4 text-blue-400" />
                                    </div>
                                    Titre de la manifestation
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-blue-400 outline-none transition-all shadow-inner placeholder-white/30 backdrop-blur-sm"
                                    placeholder="Ex: Assemblée Générale ATA"
                                    value={eventDetails.title}
                                    onChange={(e) => setEventDetails({...eventDetails, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="flex items-center text-sm font-bold text-white mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30">
                                            <Calendar className="w-4 h-4 text-blue-400" />
                                        </div>
                                        Date
                                    </label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-blue-400 outline-none transition-all shadow-inner [color-scheme:dark]"
                                        value={eventDetails.date}
                                        onChange={(e) => setEventDetails({...eventDetails, date: e.target.value})}
                                    />
                                </div>
                                <div className="group">
                                    <label className="flex items-center text-sm font-bold text-white mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30">
                                            <Clock className="w-4 h-4 text-blue-400" />
                                        </div>
                                        Heure
                                    </label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-blue-400 outline-none transition-all shadow-inner [color-scheme:dark]"
                                        value={eventDetails.time}
                                        onChange={(e) => setEventDetails({...eventDetails, time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="flex items-center text-sm font-bold text-white mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30">
                                        <MapPin className="w-4 h-4 text-blue-400" />
                                    </div>
                                    Locale / Lieu
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-blue-400 outline-none transition-all shadow-inner placeholder-white/30 backdrop-blur-sm"
                                    placeholder="Ex: Salle de conférence, Tunis"
                                    value={eventDetails.location}
                                    onChange={(e) => setEventDetails({...eventDetails, location: e.target.value})}
                                />
                            </div>

                            <div className="group relative">
                                <label className="flex items-center justify-between text-sm font-bold text-white mb-3">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30">
                                            <Lock className="w-4 h-4 text-blue-400" />
                                        </div>
                                        Qui peut utiliser le scanner
                                    </div>
                                    <span className="text-xs font-normal text-blue-200/50 bg-white/5 py-1 px-3 rounded-full border border-white/5">
                                        {eventDetails.authorizedScanners.length} selectionné(es)
                                    </span>
                                </label>
                                
                                <button 
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-blue-400 outline-none transition-all flex justify-between items-center backdrop-blur-sm group/btn"
                                >
                                    <span className="text-white/70 truncate">
                                        {eventDetails.authorizedScanners.length === 0 
                                            ? "Sélectionner les personnes autorisées..." 
                                            : `${eventDetails.authorizedScanners.length} options sélectionnées`}
                                    </span>
                                    <ChevronRight className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-90' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-[#1e293b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
                                        <div className="max-h-64 overflow-y-auto p-4 custom-scrollbar">
                                            
                                            {/* Roles Section */}
                                            <div className="mb-4">
                                                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3 px-1">Rôles globaux</div>
                                                <div className="space-y-1">
                                                    <label className="flex items-center p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5 group">
                                                        <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                                                            <input type="checkbox" className="peer w-5 h-5 opacity-0 absolute cursor-pointer" 
                                                                checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes('admin')}
                                                                onChange={(e) => handleScannerToggle('admin', e.target.checked)} />
                                                            <div className="w-5 h-5 border-2 border-white/20 rounded-md flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all">
                                                                <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Administrateurs Uniquement</span>
                                                    </label>
                                                    <label className="flex items-center p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5 group">
                                                        <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                                                            <input type="checkbox" className="peer w-5 h-5 opacity-0 absolute cursor-pointer" 
                                                                checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes('president')}
                                                                onChange={(e) => handleScannerToggle('president', e.target.checked)} />
                                                            <div className="w-5 h-5 border-2 border-white/20 rounded-md flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all">
                                                                <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Présidents et Admins</span>
                                                    </label>
                                                    <label className="flex items-center p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5 group">
                                                        <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                                                            <input type="checkbox" className="peer w-5 h-5 opacity-0 absolute cursor-pointer" 
                                                                checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes('all')}
                                                                onChange={(e) => handleScannerToggle('all', e.target.checked)} />
                                                            <div className="w-5 h-5 border-2 border-white/20 rounded-md flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all">
                                                                <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">Moi (Organisateur actuel)</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Specific Members Section */}
                                            {availableMembers.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3 px-1 pt-4 border-t border-white/10 mt-2">Membres Spécifiques</div>
                                                    <div className="space-y-1">
                                                        {availableMembers.map(m => (
                                                            <label key={m._id} className="flex items-center p-2.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5 group">
                                                                <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                                                                    <input type="checkbox" className="peer w-5 h-5 opacity-0 absolute cursor-pointer" 
                                                                        checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes(m._id)}
                                                                        onChange={(e) => handleScannerToggle(m._id, e.target.checked)} />
                                                                    <div className="w-5 h-5 border-2 border-white/20 rounded-md flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all">
                                                                        <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                                                                        {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : (m.name || 'Membre')}
                                                                    </span>
                                                                    <span className="text-[10px] text-white/40">{m.email}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={isSavingEvent} className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-lg rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSavingEvent ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                            {isSavingEvent ? "CRÉATION..." : "ENREGISTRER L'ÉVÈNEMENT"}
                        </button>
                        
                        <button type="button" onClick={() => setStep(0)} className="w-full mt-3 py-3 text-white/50 hover:text-white font-bold text-sm text-center transition-colors">
                            Retour à la liste
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // SCANNING STEP
    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
            {/* Top Bar for Event Info */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-4">
                    <button onClick={() => {stopScan(); setStep(0);}} className="p-3 text-gray-500 hover:text-blue-600 bg-white shadow-sm border border-gray-100 hover:bg-blue-50 hover:border-blue-100 rounded-full transition-all hover:-translate-y-0.5" title="Retour aux évènements">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-900 leading-tight">{eventDetails.title || 'Scanner'}</h2>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{eventDetails.date}</span> &bull; <span>{eventDetails.location}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Users className="w-4 h-4" /> {scannedUsers.length}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Column 1: Scanner View */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="bg-white p-4 shadow-lg rounded-3xl border border-gray-100 overflow-hidden relative">
                        {/* Status Messages */}
                        {scanResult && (
                            <div className={`absolute top-4 left-4 right-4 z-20 border px-4 py-3 rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-4 ${scanResult === 'success' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-red-100 border-red-200 text-red-700'}`}>
                                <span className="text-sm font-semibold">{feedbackMessage}</span>
                                <button onClick={() => {setScanResult(null); setFeedbackMessage('');}}><X className="w-4 h-4"/></button>
                            </div>
                        )}

                        <div className="mb-4 flex gap-2">
                            <select 
                                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none text-gray-600"
                                value={activeCameraId || ''}
                                onChange={(e) => setActiveCameraId(e.target.value)}
                                disabled={isScanning}
                            >
                                {cameras.map(cam => (
                                    <option key={cam.id} value={cam.id}>{cam.label}</option>
                                ))}
                                {cameras.length === 0 && <option value="">Caméra introuvable</option>}
                            </select>
                        </div>
                        <p className="text-gray-500 mb-6">Pointez la caméra vers le QR Code du membre pour l'enregistrer</p>
                        
                        {/* Scan Mode Toggle */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-gray-100 p-1 rounded-xl inline-flex relative shadow-inner">
                                <button 
                                    onClick={() => setScanMode('enter')}
                                    className={`relative z-10 flex items-center px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${scanMode === 'enter' ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LogIn size={18} className="mr-2" /> Entrée
                                </button>
                                <button 
                                    onClick={() => setScanMode('exit')}
                                    className={`relative z-10 flex items-center px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${scanMode === 'exit' ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LogOut size={18} className="mr-2" /> Sortie
                                </button>
                                {/* Sliding indicator background */}
                                <div 
                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ${scanMode === 'enter' ? 'bg-gradient-to-r from-emerald-500 to-green-500 translate-x-0' : 'bg-gradient-to-r from-orange-500 to-red-500 translate-x-[calc(100%+8px)]'}`}
                                ></div>
                            </div>
                        </div>

                        <div className="relative max-w-[320px] mx-auto overflow-hidden rounded-[2rem] bg-black aspect-square shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-gray-900 mb-6 group transition-all">
                            <div id="reader" className="w-[125%] h-[125%] ml-[-12.5%] mt-[-12.5%]"></div>
                            {!isScanning && (
                                <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-white backdrop-blur-md z-10">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                                        <Camera className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <p className="font-bold text-xl text-center px-4 tracking-tight">Scanner en pause</p>
                                    <p className="text-sm text-gray-400 mb-8 mt-2">Appuyez pour activer la caméra</p>
                                    <button onClick={startScan} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-1">Démarrer le Check-in</button>
                                </div>
                            )}
                            {isScanning && (
                                <button onClick={stopScan} className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-red-600/90 text-white rounded-full font-bold shadow-lg backdrop-blur-md hover:bg-red-500 hover:scale-105 transition-all z-20 text-sm flex items-center gap-2">
                                    <X className="w-4 h-4"/> Stop
                                </button>
                            )}
                            
                            {/* Scanning Overlay Creative Grid Effect */}
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                                    {scanMode === 'enter' ? (
                                        <>
                                            <div className="absolute inset-0 border-[6px] border-emerald-500/20 m-6 rounded-3xl transition-all duration-1000"></div>
                                            <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-400 shadow-[0_0_15px_4px_rgba(52,211,153,0.6)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 border-[6px] border-orange-500/20 m-6 rounded-3xl transition-all duration-1000"></div>
                                            <div className="absolute top-0 left-0 w-full h-[3px] bg-orange-400 shadow-[0_0_15px_4px_rgba(251,146,60,0.6)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button 
                                onClick={toggleScanner} 
                                className={`flex-1 py-3 rounded-xl font-bold font-sm flex items-center justify-center gap-2 transition-colors ${
                                    isScanning ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                            >
                                <ScanIcon isScanning={isScanning} />
                                {isScanning ? 'Pause' : 'Reprendre'}
                            </button>
                            <button 
                                onClick={() => setShowVisitorModal(true)}
                                className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-5 h-5" /> Visiteur
                            </button>
                        </div>

                        {/* Manual Member Selection */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Recherche Manuelle (Sans Scan)</p>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Nom ou Prénom du membre..." 
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onChange={(e) => {
                                        const term = e.target.value.toLowerCase();
                                        // Simple local filter if needed or just show the dropdown
                                        setIsDropdownOpen(true);
                                    }}
                                />
                                {isDropdownOpen && (
                                    <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 animate-in fade-in zoom-in-95 duration-200 scrollbar-hide">
                                        {availableMembers.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-xs">Aucun membre trouvé</div>
                                        ) : (
                                            availableMembers.map(m => (
                                                <button 
                                                    key={m._id} 
                                                    onClick={() => {
                                                        setIsDropdownOpen(false);
                                                        // Simulate a scan result with the member's ID
                                                        handleScanResult(m._id);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-3 group"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        {m.firstName?.[0] || m.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-800">{m.firstName} {m.lastName}</div>
                                                        <div className="text-[10px] text-gray-500">{m.email || 'Pas d\'email'}</div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Scanned Users Table */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
                    <div className="bg-white shadow-lg rounded-3xl border border-gray-100 flex flex-col flex-1 overflow-hidden">
                        
                        {/* Header & Actions */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Historique des scans
                            </h3>
                            <div className="flex items-center gap-2">
                                <button onClick={exportToExcel} className="p-2 lg:px-4 lg:py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors" title="Excel">
                                    <FileSpreadsheet className="w-4 h-4" /> <span className="hidden lg:inline">Excel</span>
                                </button>
                                <button onClick={exportToPDF} className="p-2 lg:px-4 lg:py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors" title="PDF">
                                    <Download className="w-4 h-4" /> <span className="hidden lg:inline">PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto bg-white p-0 relative min-h-[300px]">
                            {scannedUsers.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <Users className="w-16 h-16 opacity-30 mb-3" />
                                    <p>{"Aucun participant n'a encore été scanné"}</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 z-[1]">
                                        <tr>
                                            <th className="px-4 py-3">Nom / Prénom</th>
                                            <th className="px-4 py-3">Contacts</th>
                                            <th className="px-4 py-3">Club / Statut</th>
                                            <th className="px-4 py-3">Historique de Passage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {scannedUsers.map(user => (
                                            <tr key={user._id} className="hover:bg-blue-50/50 transition-colors animate-in fade-in slide-in-from-left-2">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-gray-900">{user.firstName} {user.lastName}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    <div>{user.phone || '-'}</div>
                                                    <div className="text-xs mt-0.5 max-w-[120px] truncate" title={user.email}>{user.email || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold leading-none ${user.club === 'Visiteur' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                        {user.club}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        {user.history && user.history.map((h, i) => (
                                                            <div key={i} className={`flex items-center text-xs px-2 py-1 rounded-md ${!h.exit ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                                                                <LogIn size={12} className="mr-1 text-green-600" /> <span className="mr-2 font-bold">{h.enter}</span>
                                                                {h.exit && (
                                                                    <>
                                                                       <ArrowRightLeft size={10} className="mx-1 text-gray-400" />
                                                                       <LogOut size={12} className="ml-1 mr-1 text-red-500" /> <span className="font-bold text-red-700">{h.exit}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        
                        <div className="bg-gray-50 border-t border-gray-100 p-3 text-center text-xs text-gray-500 font-medium">
                            {"Les données resteront ici tant que vous ne changez pas de manifestation. N'oubliez pas d'exporter."}
                        </div>
                    </div>
                </div>

            </div>

            {/* VISITOR MODAL */}
            {showVisitorModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="text-blue-500" /> Ajouter un Visiteur
                            </h3>
                            <button onClick={() => setShowVisitorModal(false)} className="text-gray-400 hover:text-gray-700 p-1">
                                <X />
                            </button>
                        </div>
                        <form onSubmit={handleAddVisitor} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Prénom</label>
                                    <input required type="text" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" value={visitorData.firstName} onChange={e => setVisitorData({...visitorData, firstName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Nom</label>
                                    <input required type="text" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" value={visitorData.lastName} onChange={e => setVisitorData({...visitorData, lastName: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600 mb-1 block">Email (Optionnel)</label>
                                <input type="email" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" value={visitorData.email} onChange={e => setVisitorData({...visitorData, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600 mb-1 block">Téléphone (Optionnel)</label>
                                <input type="tel" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" value={visitorData.phone} onChange={e => setVisitorData({...visitorData, phone: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full py-3 mt-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors">
                                Ajouter à la liste
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    );
}

function ScanIcon({ isScanning }) {
    if (isScanning) {
        return <div className="w-4 h-4 border-2 border-amber-500 rounded-sm"></div>;
    }
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V7.5a2.25 2.25 0 012.25-2.25h1.5M21 8.25V7.5a2.25 2.25 0 00-2.25-2.25h-1.5M3 15.75v.75a2.25 2.25 0 002.25 2.25h1.5M21 15.75v.75a2.25 2.25 0 01-2.25 2.25h-1.5M10.5 12h3" />
        </svg>
    );
}
