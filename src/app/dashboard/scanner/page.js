"use client";

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Shield, Settings, Users, Save, Download, FileSpreadsheet, Plus, X, Camera, MapPin, Calendar, Clock, Lock } from 'lucide-react';
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';

export default function QRScannerPage() {
    const [step, setStep] = useState('SETUP'); // SETUP, SCANNING
    
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
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [cameraDevices, setCameraDevices] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const html5QrCodeRef = useRef(null);

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
                setCameraDevices(devices);
                // Prefer back camera if available, otherwise first camera
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('arrière'));
                setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
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

    const startScan = async () => {
        if (!selectedCamera) {
            setError("Aucune caméra sélectionnée.");
            return;
        }

        setError(null);
        setSuccessMessage(null);
        setIsScanning(true);

        setTimeout(() => {
            html5QrCodeRef.current = new Html5Qrcode("reader");
            html5QrCodeRef.current.start(
                selectedCamera,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText, decodedResult) => {
                    handleScanResult(decodedText);
                },
                (errorMessage) => {
                    // Ignore background scan errors
                }
            ).catch((err) => {
                console.error("Erreur de démarrage du scanner:", err);
                setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
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
        // Debounce / Prevent multiple reads of same QR instantly
        if (isScanning) {
            stopScan();
        }

        try {
            // URL format expected: https://domain/card/123456789...
            // Extract the ID from the end or parse normally
            let qrid = '';
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                qrid = pathParts[pathParts.length - 1];
            } catch (e) {
                // Not a URL, maybe just raw ID string
                qrid = url;
            }

            if (!qrid || qrid.length < 24) {
                throw new Error("QR Code invalide ou non reconnu.");
            }

            // Check if user is already scanned
            if (scannedUsers.some(u => u.id === qrid)) {
                setError("Ce membre a déjà été scanné !");
                setTimeout(startScan, 2000);
                return;
            }

            // Fetch user info using existing card API
            const res = await fetch(`/api/user/card/${qrid}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur lors de la récupération des infos.');
            }

            const userData = await res.json();

            const newUser = {
                id: userData._id || qrid,
                firstName: userData.firstName || userData.name || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.whatsapp || userData.phone || '',
                club: userData.club?.name || 'Touches D\'Art (Membre)',
                type: 'Membre',
                scannedAt: new Date().toLocaleTimeString(),
            };

            setScannedUsers(prev => [newUser, ...prev]);
            setSuccessMessage(`${newUser.firstName} ${newUser.lastName} ajouté(e) avec succès !`);
            setError(null);
            
            // Auto restart scan after 2 seconds
            setTimeout(startScan, 2000);

        } catch (err) {
            setError(err.message || "Erreur de lecture du QR Code.");
            // Auto restart scan after error
            setTimeout(startScan, 2500);
        }
    };

    const handleAddVisitor = (e) => {
        e.preventDefault();
        const visitor = {
            id: `visitor_${Date.now()}`,
            firstName: visitorData.firstName,
            lastName: visitorData.lastName,
            email: visitorData.email,
            phone: visitorData.phone,
            club: 'Visiteur',
            type: 'Visiteur',
            scannedAt: new Date().toLocaleTimeString(),
        };

        setScannedUsers(prev => [visitor, ...prev]);
        setSuccessMessage(`${visitor.firstName} ajouté(e) en tant que visiteur.`);
        setShowVisitorModal(false);
        setVisitorData({ firstName: '', lastName: '', email: '', phone: '' });
    };

    const exportToExcel = () => {
        if (scannedUsers.length === 0) return alert("Aucune donnée à exporter.");
        
        const worksheetData = scannedUsers.map((user, index) => ({
            'N°': index + 1,
            'Nom et Prénom': `${user.firstName} ${user.lastName}`.trim(),
            'Email': user.email,
            'Numéro / WhatsApp': user.phone,
            'Club / Statut': user.club,
            'Heure Scanner': user.scannedAt
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(worksheetData);
        xlsx.utils.book_append_sheet(wb, ws, "Présences");
        
        const fileName = `Presences_${eventDetails.title.replace(/\s+/g, '_')}_${eventDetails.date}.xlsx`;
        xlsx.writeFile(wb, fileName);
    };

    const exportToPDF = () => {
        if (scannedUsers.length === 0) return alert("Aucune donnée à exporter.");

        const doc = new jsPDF('landscape');
        
        // Header
        doc.setFontSize(18);
        doc.text(`Liste de Présence - ${eventDetails.title || 'Manifestation'}`, 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Date : ${eventDetails.date} à ${eventDetails.time}`, 14, 28);
        doc.text(`Lieu : ${eventDetails.location || 'Non spécifié'}`, 14, 34);
        doc.text(`Total Scanné(s) : ${scannedUsers.length} personne(s)`, 14, 40);

        // Table
        const tableColumn = ["N°", "Nom et Prénom", "Email", "Téléphone/WhatsApp", "Club / Statut", "Heure"];
        const tableRows = scannedUsers.map((u, i) => [
            i + 1,
            `${u.firstName} ${u.lastName}`.trim(),
            u.email,
            u.phone,
            u.club,
            u.scannedAt
        ]);

        doc.autoTable({
            startY: 45,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] }
        });

        doc.save(`Presences_${eventDetails.title.replace(/\s+/g, '_')}_${eventDetails.date}.pdf`);
    };

    if (step === 'SETUP') {
        return (
            <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
                <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
                        <Camera className="w-16 h-16 text-white/90 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">{"Scanner d'Évènements"}</h1>
                        <p className="text-blue-100">Configurez votre manifestation avant de commencer le check-in</p>
                    </div>
                    
                    <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); setStep('SCANNING'); }}>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <Settings className="w-4 h-4 mr-2 text-blue-500" /> Titre de la manifestation
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: Assemblée Générale ATA"
                                    value={eventDetails.title}
                                    onChange={(e) => setEventDetails({...eventDetails, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Date
                                    </label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={eventDetails.date}
                                        onChange={(e) => setEventDetails({...eventDetails, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                        <Clock className="w-4 h-4 mr-2 text-blue-500" /> Heure
                                    </label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={eventDetails.time}
                                        onChange={(e) => setEventDetails({...eventDetails, time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <MapPin className="w-4 h-4 mr-2 text-blue-500" /> Locale / Lieu
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ex: Salle de conférence, Tunis"
                                    value={eventDetails.location}
                                    onChange={(e) => setEventDetails({...eventDetails, location: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <Lock className="w-4 h-4 mr-2 text-blue-500" /> Qui peut utiliser le scanner
                                </label>
                                {/* CUSTOM MULTI-SELECT DROPDOWN */}
                                <div className="relative">
                                    <button 
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-left focus:ring-2 focus:ring-blue-500 outline-none transition-all flex justify-between items-center"
                                    >
                                        <span className="text-gray-700 truncate">
                                            {eventDetails.authorizedScanners.length === 0 
                                                ? "Sélectionner qui peut scanner..." 
                                                : `${eventDetails.authorizedScanners.length} options sélectionnées`}
                                        </span>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl">
                                            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                                <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Rôles globaux</div>
                                                <label className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                                                        checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes('admin')}
                                                        onChange={(e) => handleScannerToggle('admin', e.target.checked)} />
                                                    <span className="ml-3 text-sm font-medium text-gray-700">Administrateurs Uniquement</span>
                                                </label>
                                                <label className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                                                        checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes('president')}
                                                        onChange={(e) => handleScannerToggle('president', e.target.checked)} />
                                                    <span className="ml-3 text-sm font-medium text-gray-700">Présidents et Admins</span>
                                                </label>
                                                <label className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                                                        checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes('all')}
                                                        onChange={(e) => handleScannerToggle('all', e.target.checked)} />
                                                    <span className="ml-3 text-sm font-medium text-gray-700">Moi (Organisateur actuel)</span>
                                                </label>
                                                
                                                {availableMembers.length > 0 && (
                                                    <>
                                                        <div className="px-2 py-1 mt-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 pt-3">Membres Spécifiques</div>
                                                        {availableMembers.map(m => (
                                                            <label key={m._id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                                                                    checked={Array.isArray(eventDetails.authorizedScanners) && eventDetails.authorizedScanners.includes(m._id)}
                                                                    onChange={(e) => handleScannerToggle(m._id, e.target.checked)} />
                                                                <span className="ml-3 text-sm font-medium text-gray-700">
                                                                    {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : (m.name || 'Membre')}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 italic">{"Paramétrage de l'accès et de l'historique de l'évènement. Plusieurs choix possibles."}</p>
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" /> Enregistrer et Ouvrir le Scanner
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // SCANNING STEP
    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
            {/* Top Bar for Event Info */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => {stopScan(); setStep('SETUP');}} className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                        <Settings className="w-5 h-5" />
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
                        {error && (
                            <div className="absolute top-4 left-4 right-4 z-20 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                                <span className="text-sm font-semibold">{error}</span>
                                <button onClick={() => setError(null)}><X className="w-4 h-4"/></button>
                            </div>
                        )}
                        {successMessage && (
                            <div className="absolute top-4 left-4 right-4 z-20 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                                <span className="text-sm font-semibold">{successMessage}</span>
                            </div>
                        )}

                        <div className="mb-4 flex gap-2">
                            <select 
                                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none text-gray-600"
                                value={selectedCamera}
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                disabled={isScanning}
                            >
                                {cameraDevices.map(cam => (
                                    <option key={cam.id} value={cam.id}>{cam.label}</option>
                                ))}
                                {cameraDevices.length === 0 && <option value="">Caméra introuvable</option>}
                            </select>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border-4 border-gray-100 group">
                            <div id="reader" className="w-[110%] h-[110%] ml-[-5%] mt-[-5%]"></div>
                            {!isScanning && (
                                <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center text-white backdrop-blur-sm z-10">
                                    <Camera className="w-12 h-12 mb-3 text-gray-400 group-hover:text-white transition-colors" />
                                    <p className="font-semibold text-lg text-center px-4">Scanner en pause</p>
                                    <p className="text-sm text-gray-400 mb-6">Appuyez pour activer la caméra</p>
                                    <button onClick={startScan} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all">Démarrer</button>
                                </div>
                            )}
                            {isScanning && (
                                <button onClick={stopScan} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600/90 text-white rounded-full font-semibold shadow-lg backdrop-blur-md hover:bg-red-600 transition-colors z-20 text-sm">
                                    Stop
                                </button>
                            )}
                            
                            {/* Scanning Overlay Grid Effect */}
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none border-[4px] border-blue-500/30 m-8 rounded-xl z-10 transition-all duration-1000">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
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
                                            <th className="px-4 py-3 text-right">Heure</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {scannedUsers.map((user, i) => (
                                            <tr key={user.id + i} className="hover:bg-blue-50/50 transition-colors animate-in fade-in slide-in-from-left-2">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-gray-900">{user.firstName} {user.lastName}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    <div>{user.phone || '-'}</div>
                                                    <div className="text-xs mt-0.5 max-w-[120px] truncate" title={user.email}>{user.email || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold leading-none
                                                        ${user.type === 'Visiteur' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}
                                                    `}>
                                                        {user.club}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-500 font-medium">
                                                    {user.scannedAt}
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
                    0% { top: 0; box-shadow: 0 -8px 8px -2px rgba(59,130,246,0.5); }
                    50% { top: 100%; box-shadow: 0 8px 8px -2px rgba(59,130,246,0.5); }
                    100% { top: 0; box-shadow: 0 -8px 8px -2px rgba(59,130,246,0.5); }
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
