import React, { useRef } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PAK_BOUNDS = L.latLngBounds([[23.64, 60.87], [37.10, 77.84]]);

export default function SmokeMap() {
    return (
        <div style={{ height: "100vh", width: "100vw" }}>
            <MapContainer
                center={[30.3753, 69.3451]}
                zoom={6}
                minZoom={5}
                maxBounds={PAK_BOUNDS}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
            >
                <ZoomControl position="topleft" />
                {/* Light basemap */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="© OSM, © CARTO"
                />
            </MapContainer>
        </div>
    );
}
