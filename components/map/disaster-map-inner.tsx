"use client";

import L from "leaflet";
import { CircleMarker, LayersControl, MapContainer, Marker, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { MapFeature } from "@/lib/types/disaster";
import { getMapCenter, normalizeMapFeatures } from "@/lib/map/normalize";

const colors = {
  Low: "#059669",
  Medium: "#d97706",
  High: "#dc2626"
};

const icon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#087c8a;border:2px solid white;box-shadow:0 1px 8px rgba(15,23,42,.35)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function DisasterMapInner({ features }: { features: MapFeature[] }) {
  const normalizedFeatures = normalizeMapFeatures(features);
  const mapCenter = getMapCenter(normalizedFeatures);
  const center = [mapCenter.lat, mapCenter.lng] as [number, number];
  const grouped = {
    affected: normalizedFeatures.filter((item) => item.type === "affected"),
    hospitals: normalizedFeatures.filter((item) => item.type === "hospital"),
    shelters: normalizedFeatures.filter((item) => item.type === "shelter"),
    schools: normalizedFeatures.filter((item) => item.type === "school"),
    roads: normalizedFeatures.filter((item) => item.type === "road"),
    critical: normalizedFeatures.filter((item) => item.type === "critical")
  };

  return (
    <div className="h-[520px] overflow-hidden rounded-lg border bg-card">
      <MapContainer center={center} zoom={9} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Affected Areas">
            <FeatureLayer features={grouped.affected} area />
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Hospitals">
            <FeatureLayer features={grouped.hospitals} />
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Shelters">
            <FeatureLayer features={grouped.shelters} />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Schools">
            <FeatureLayer features={grouped.schools} />
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Roads">
            <FeatureLayer features={grouped.roads} area />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Critical Infrastructure">
            <FeatureLayer features={grouped.critical} />
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}

function FeatureLayer({ features, area = false }: { features: MapFeature[]; area?: boolean }) {
  return <>{features.map((feature) => area ? <CircleMarker key={feature.id} center={[feature.lat, feature.lng]} radius={18} pathOptions={{ color: colors[feature.severity], fillColor: colors[feature.severity], fillOpacity: 0.25 }}><FeaturePopup feature={feature} /></CircleMarker> : <Marker key={feature.id} position={[feature.lat, feature.lng]} icon={icon}><FeaturePopup feature={feature} /></Marker>)}</>;
}

function FeaturePopup({ feature }: { feature: MapFeature }) {
  return (
    <>
      <Tooltip>{feature.name}</Tooltip>
      <Popup>
        <div className="space-y-1 text-sm">
          <strong>{feature.name}</strong>
          <div>{feature.municipality}</div>
          <div>Risk: {feature.severity}</div>
          <div>{feature.note}</div>
        </div>
      </Popup>
    </>
  );
}
