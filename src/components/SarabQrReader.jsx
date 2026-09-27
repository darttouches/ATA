import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, XCircle } from 'lucide-react';

export default function SarabQrReader({ onScanSuccess, onCancel, t }) {
    const [hasCameras, setHasCameras] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let html5QrCode;

        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                setHasCameras(true);
                // Use the first available or the back camera
                let cameraId = devices[0].id;
                // Try to find a back camera
                for (const device of devices) {
                    if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('arrière') || device.label.toLowerCase().includes('rear')) {
                        cameraId = device.id;
                        break;
                    }
                }

                html5QrCode = new Html5Qrcode("reader");
                html5QrCode.start(
                    cameraId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText, decodedResult) => {
                        html5QrCode.stop().then(() => {
                            onScanSuccess(decodedText);
                        }).catch(e => {
                            onScanSuccess(decodedText);
                        });
                    },
                    (errorMessage) => {
                        // ignore background errors
                    })
                .catch((err) => {
                    setError('Erreur lors du démarrage de la caméra : ' + err);
                });
            } else {
                setHasCameras(false);
                setError('Aucune caméra détectée sur cet appareil.');
            }
        }).catch(err => {
            setHasCameras(false);
            setError('Permission refusée ou appareil non supporté.');
        });

        return () => {
            if (html5QrCode) {
                html5QrCode.stop().catch(e => console.log('Stop error', e));
            }
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <h3 style={{ color: '#00f0ff', fontFamily: 'Orbitron', marginBottom: '20px' }}>
                <Camera size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }}/>
                {t('scanQrBtn') || 'Scan QR Code'}
            </h3>
            
            <div id="reader" style={{ width: '100%', maxWidth: '400px', background: '#000', borderRadius: '10px', overflow: 'hidden', border: '2px solid #00f0ff' }}></div>
            
            {error && (
                <div style={{ color: '#ff4444', marginTop: '20px', textAlign: 'center', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                    {error}
                </div>
            )}
            
            <button
                type="button"
                onClick={onCancel}
                style={{
                    marginTop: '30px',
                    background: '#ff4444',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    fontFamily: 'Rajdhani',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <XCircle size={20} />
                Annuler
            </button>
        </div>
    );
}
