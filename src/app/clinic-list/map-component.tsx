import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Building2 } from "lucide-react"
import { useEffect } from "react"
import React from "react"

// Component to handle map bounding to all markers
function FitBounds({ locations }: { locations: any[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (locations.length === 0) return
    
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 15)
      return
    }

    const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [locations, map])
  
  return null
}

// Custom Modern Pin Icon
const createCustomIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="size-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
           <div class="size-2 bg-white rounded-full"></div>
        </div>
        <div class="absolute -bottom-1 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-primary"></div>
      </div>
    `,
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    tooltipAnchor: [0, -40],
  })
}

interface MapComponentProps {
  locations: Array<{
    lat: number
    lng: number
    clinic: any
    address: string
  }>
}

export default function MapComponent({ locations }: MapComponentProps) {
  const defaultCenter: [number, number] = locations.length > 0 
    ? [locations[0].lat, locations[0].lng] 
    : [0, 0]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {locations.map((loc, idx) => (
        <Marker 
          key={`${loc.clinic._id}-${idx}`} 
          position={[loc.lat, loc.lng]} 
          icon={createCustomIcon()}
        >
          <Tooltip 
            permanent={true} 
            direction="top" 
            offset={[0, 0]}
            className="custom-clinic-tooltip rounded-md"
          >
            <div className="p-1 text-center min-w-[150px] !rounded-md">
              <div className="flex justify-center mb-2">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="size-4 text-primary" />
                </div>
              </div>
              <p className="font-bold text-[13px] text-slate-900 leading-tight tracking-tight px-1">
                {loc.clinic.name}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium max-w-[160px] truncate">
                {loc.address.split(',').slice(0, 2).join(',')}
              </p>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
