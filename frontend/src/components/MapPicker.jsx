import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';

const startIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    iconSize: [25, 41], iconAnchor: [12, 41], shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png', shadowSize: [41, 41],
});

const endIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41], iconAnchor: [12, 41], shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png', shadowSize: [41, 41],
});

const riderStartIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41], iconAnchor: [12, 41], shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png', shadowSize: [41, 41],
});

const MapController = ({ startPoint, endPoint }) => {
    const map = useMap();
    useEffect(() => {
        if (startPoint && endPoint) {
            map.fitBounds([[startPoint.lat, startPoint.lon], [endPoint.lat, endPoint.lon]], { padding: [50, 50] });
        } else if (startPoint) {
            map.setView([startPoint.lat, startPoint.lon], 13);
        } else if (endPoint) {
            map.setView([endPoint.lat, endPoint.lon], 13);
        }
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

    }, [startPoint, endPoint, map]);
    return null;
};

const MapPicker = ({ onLocationSelect, startPoint, endPoint, onRouteCalculated, pickupPath, riderStartPoint }) => {
    const [path, setPath] = useState([]);
    const [isRouting, setIsRouting] = useState(false);
    const [routingError, setRoutingError] = useState(null);
    const debounceTimeout = useRef(null);
    const { token } = useAuth();

    const MapEvents = () => {
        useMap({
            click: async (e) => {
                if (!onLocationSelect) return;
                const { lat, lng } = e.latlng;
                 try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    onLocationSelect({
                        lat,
                        lon: lng,
                        address: data.display_name || `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`
                    });
                } catch (error) {
                    console.error("Error reverse geocoding:", error);
                    onLocationSelect({ lat, lon: lng, address: `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}` });
                }
            },
        });
        return null;
    };

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        if (startPoint && endPoint) {
            setIsRouting(true);
            setRoutingError(null);
            setPath([]);

            debounceTimeout.current = setTimeout(() => {
                const fetchRoute = async () => {
                    try {
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/proxy/route`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ "coordinates": [[startPoint.lon, startPoint.lat], [endPoint.lon, endPoint.lat]] })
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error.message || 'Failed to fetch route');
                        }
                        
                        const data = await response.json();
                        const route = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        const distance = data.features[0].properties.summary.distance / 1000;
                        
                        setPath(route);
                        if (onRouteCalculated) onRouteCalculated(distance);

                    } catch (err) {
                        console.error("Routing error:", err);
                        setRoutingError(err.message);
                        if (onRouteCalculated) onRouteCalculated(0);
                    } finally {
                        setIsRouting(false);
                    }
                };
                fetchRoute();
            }, 500);

        } else {
            setPath([]);
            setIsRouting(false);
            if (onRouteCalculated) onRouteCalculated(0);
        }

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [startPoint, endPoint, onRouteCalculated, token]);

    return (
        <div className="relative h-full w-full">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {startPoint && <Marker position={[startPoint.lat, startPoint.lon]} icon={startIcon} />}
                {endPoint && <Marker position={[endPoint.lat, endPoint.lon]} icon={endIcon} />}
                
                {riderStartPoint && <Marker position={[riderStartPoint.lat, riderStartPoint.lon]} icon={riderStartIcon} />}
                
                {path.length > 0 && <Polyline positions={path} color="#0055ff" weight={5} />}
                
                {pickupPath && pickupPath.length > 0 && (
                    <Polyline positions={pickupPath} color="#f97316" weight={5} dashArray="10, 10" />
                )}
                
                <MapEvents />
                <MapController startPoint={startPoint} endPoint={endPoint} />
            </MapContainer>
            
            {isRouting && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white text-gray-800 px-3 py-1 rounded-md shadow-lg text-sm font-medium">
                    Calculating route...
                </div>
            )}
            {routingError && (
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-3 py-1 rounded-md shadow-lg text-sm font-medium">
                    Error: {routingError}
                </div>
            )}
        </div>
    );
};

export default MapPicker;

