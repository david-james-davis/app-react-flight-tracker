import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card } from '@david-james-davis/react-component-library';
import planeSvg from './assets/plane.svg';
import 'leaflet/dist/leaflet.css';

type FlightObject = {
  flight: string;
  r: string;
  nav_altitude_mcp?: number;
  nav_heading: number;
  lat: number;
  lon: number;
};

type FlightPaths = {
  [key: string]: [number, number][];
};

type Flights = {
  callsign: string;
  latitude: number;
  longitude: number;
  heading: string;
};

const planeIcon = new L.Icon({
  iconUrl: planeSvg,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function FlightTracker() {
  const [flights, setFlights] = useState<Flights[]>([]);
  const [flightPaths, setFlightPaths] = useState({});

  useEffect(() => {
    const newFlightPaths: FlightPaths = { ...flightPaths };
    const eventSource = new EventSource('/events');

    eventSource.onmessage = event => {
      const events = JSON.parse(event.data);
      const processedFlights = events?.ac
        .filter((flight: FlightObject) => flight.lat && flight.lon) // Ensure valid coordinates
        .map((flight: FlightObject) => {
          const callsign = flight?.r?.trim() || 'Unknown';
          const latitude = flight.lat;
          const longitude = flight.lon;
          const heading = flight?.nav_altitude_mcp || 0;

          // Store flight paths
          if (!newFlightPaths[callsign]) {
            newFlightPaths[callsign] = [];
          }
          newFlightPaths[callsign].push([latitude, longitude]);

          // Keep only last 5 locations
          if (newFlightPaths[callsign].length > 5) {
            newFlightPaths[callsign].shift();
          }

          return { callsign, latitude, longitude, heading };
        });

      setFlights(processedFlights);
      setFlightPaths(newFlightPaths);
    };

    eventSource.onopen = () => {
      console.log('Connection to server opened.');
    };

    eventSource.onerror = error => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <Card sx={{ width: '60vw', height: '600px' }}>
      <MapContainer center={[38.89511, -77.03637]} zoom={10} style={{ height: '600px', width: '100%' }}>
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        {flights.map(flight => {
          return <Marker key={flight.callsign} position={[flight.latitude, flight.longitude]} icon={planeIcon} />;
        })}
        {Object.values(flightPaths).map((path, index) => (
          <Polyline key={index} positions={path as [number, number][]} color='blue' />
        ))}
      </MapContainer>
    </Card>
  );
}

export default FlightTracker;
