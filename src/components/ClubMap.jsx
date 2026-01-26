"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function ClubMap({ clubs, center, zoom = 13 }) {
    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
            <ChangeView center={center} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clubs.map(club => (
                club.coordinates && (
                    <Marker key={club._id} position={[club.coordinates.lat, club.coordinates.lng]}>
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <strong>{club.name}</strong><br />
                                {club.address}
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    );
}
