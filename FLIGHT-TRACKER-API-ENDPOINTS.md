# Flight Tracker Widget - API Endpoints Documentation

## Base URL
```
http://localhost:1337/api
```

## Authentication
All endpoints are publicly accessible (no authentication required).

---

## 📊 **Core CRUD Endpoints**

### Get All Flight Records
```http
GET /flight-trackers
```
**Query Parameters:**
- `filters[Airport][$eq]=BKK` - Filter by airport
- `filters[FlightType][$eq]=arrival` - Filter by flight type
- `filters[FlightStatus][$eq]=active` - Filter by status
- `sort=ScheduledTime:asc` - Sort by scheduled time
- `pagination[limit]=25` - Limit results
- `populate=*` - Include all relations

**Example:**
```javascript
fetch('http://localhost:1337/api/flight-trackers?filters[Airport][$eq]=BKK&sort=ScheduledTime:asc')
```

### Get Single Flight Record
```http
GET /flight-trackers/{id}
```

### Create Flight Record
```http
POST /flight-trackers
Content-Type: application/json

{
  "data": {
    "FlightNumber": "TG101",
    "Airline": "Thai Airways",
    "FlightType": "arrival",
    "Airport": "BKK",
    "FlightStatus": "active",
    "ScheduledTime": "2025-01-11T14:30:00.000Z",
    "FlightDate": "2025-01-11"
  }
}
```

---

## ✈️ **Live Flight Data Endpoints**

### Get Live Flight Data (AviationStack API)
```http
GET /flight-tracker/live/{airport}
```
**Parameters:**
- `airport` - BKK, DMK, or UTP
- `type` - both, arrivals, departures (default: both)
- `limit` - Number of flights (default: 50)
- `status` - Filter by flight status

**Example:**
```javascript
// Get live BKK arrivals
fetch('http://localhost:1337/api/flight-tracker/live/BKK?type=arrivals&limit=10')

// Response:
{
  "data": [
    {
      "FlightNumber": "TG101",
      "Airline": "Thai Airways International",
      "FlightStatus": "active",
      "FlightType": "arrival",
      "Airport": "BKK",
      "ScheduledTime": "2025-01-11T14:30:00.000Z",
      "EstimatedTime": "2025-01-11T14:45:00.000Z",
      "DelayMinutes": 15,
      "Terminal": "1",
      "Gate": "A7"
    }
  ],
  "meta": {
    "airport": "BKK",
    "type": "arrivals",
    "total": 1,
    "lastUpdated": "2025-09-11T09:18:54.422Z"
  }
}
```

### Get Airport Arrivals
```http
GET /flight-tracker/{airport}/arrivals
```
**Example:**
```javascript
fetch('http://localhost:1337/api/flight-tracker/BKK/arrivals?limit=15')
```

### Get Airport Departures
```http
GET /flight-tracker/{airport}/departures
```
**Example:**
```javascript
fetch('http://localhost:1337/api/flight-tracker/DMK/departures?limit=15')
```

### Get All Airports Data
```http
GET /flight-tracker/airports/all
```
**Example:**
```javascript
fetch('http://localhost:1337/api/flight-tracker/airports/all?limit=30')

// Response:
{
  "data": {
    "BKK": [...flights],
    "DMK": [...flights],
    "UTP": [...flights]
  },
  "meta": {
    "summary": {
      "BKK": { "flights": 5, "airport": "Suvarnabhumi Airport" },
      "DMK": { "flights": 3, "airport": "Don Mueang International" },
      "UTP": { "flights": 1, "airport": "U-Tapao International" }
    },
    "totalFlights": 9
  }
}
```

---

## 🗄️ **Database Cache Endpoints**

### Get Cached Flight Data
```http
GET /flight-tracker/cached/{airport}
```
**Parameters:**
- `airport` - BKK, DMK, or UTP
- `type` - both, arrivals, departures
- `status` - Filter by flight status
- `limit` - Number of flights (default: 50)

**Example:**
```javascript
// Get cached BKK flights from database
fetch('http://localhost:1337/api/flight-tracker/cached/BKK?type=both&limit=20')
```

---

## 🔄 **Data Synchronization**

### Sync Live Data to Database
```http
POST /flight-tracker/sync/{airport}
```
**Example:**
```javascript
// Sync live BKK data to database
fetch('http://localhost:1337/api/flight-tracker/sync/BKK', {
  method: 'POST'
})

// Response:
{
  "success": true,
  "message": "Synced flight data for BKK",
  "data": {
    "created": 3,
    "updated": 2,
    "total": 5,
    "airport": "BKK"
  }
}
```

---

## 📊 **Service Status**

### Get System Status
```http
GET /flight-tracker/status
```
**Example:**
```javascript
fetch('http://localhost:1337/api/flight-tracker/status')

// Response:
{
  "success": true,
  "data": {
    "apiConnection": {
      "success": true,
      "message": "AviationStack API connection successful",
      "remainingCalls": 209577
    },
    "database": {
      "totalFlights": 6,
      "activeFlights": 5,
      "lastSync": "2025-09-11T09:18:48.424Z"
    },
    "supportedAirports": {
      "BKK": { "name": "Suvarnabhumi Airport", "city": "Bangkok" },
      "DMK": { "name": "Don Mueang International Airport", "city": "Bangkok" },
      "UTP": { "name": "U-Tapao International Airport", "city": "Pattaya" }
    }
  }
}
```

---

## 🔍 **Search Integration**

### Algolia Search
The flight data is automatically indexed in Algolia. Use the unified search endpoint:

```http
GET /unified-search
```
**Parameters:**
- `query` - Search term (flight number, airline, airport)
- `filters` - Additional filters

---

## 📱 **Frontend Integration Examples**

### React/Next.js Example
```javascript
// hooks/useFlightTracker.js
import { useState, useEffect } from 'react';

export const useFlightTracker = (airport, type = 'both') => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:1337/api/flight-tracker/live/${airport}?type=${type}&limit=20`
        );
        const data = await response.json();
        setFlights(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [airport, type]);

  return { flights, loading, error };
};

// components/FlightBoard.jsx
import { useFlightTracker } from '../hooks/useFlightTracker';

export const FlightBoard = ({ airport }) => {
  const { flights, loading, error } = useFlightTracker(airport);

  if (loading) return <div>Loading flights...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flight-board">
      <h2>{airport} Flight Information</h2>
      {flights.map(flight => (
        <div key={flight.FlightNumber} className="flight-row">
          <span className="flight-number">{flight.FlightNumber}</span>
          <span className="airline">{flight.Airline}</span>
          <span className="status">{flight.FlightStatus}</span>
          <span className="time">{new Date(flight.ScheduledTime).toLocaleTimeString()}</span>
          <span className="gate">{flight.Gate || 'TBA'}</span>
        </div>
      ))}
    </div>
  );
};
```

### Vanilla JavaScript Example
```javascript
// flight-tracker.js
class FlightTracker {
  constructor(baseUrl = 'http://localhost:1337/api') {
    this.baseUrl = baseUrl;
  }

  async getLiveFlights(airport, options = {}) {
    const { type = 'both', limit = 25, status } = options;
    const params = new URLSearchParams({ type, limit });
    if (status) params.append('status', status);
    
    const response = await fetch(
      `${this.baseUrl}/flight-tracker/live/${airport}?${params}`
    );
    return response.json();
  }

  async getCachedFlights(airport, options = {}) {
    const { type = 'both', limit = 25 } = options;
    const params = new URLSearchParams({ type, limit });
    
    const response = await fetch(
      `${this.baseUrl}/flight-tracker/cached/${airport}?${params}`
    );
    return response.json();
  }

  async getStatus() {
    const response = await fetch(`${this.baseUrl}/flight-tracker/status`);
    return response.json();
  }
}

// Usage
const flightTracker = new FlightTracker();

// Get live BKK flights
flightTracker.getLiveFlights('BKK', { type: 'arrivals', limit: 10 })
  .then(data => console.log('Live flights:', data));

// Get cached flights
flightTracker.getCachedFlights('DMK')
  .then(data => console.log('Cached flights:', data));
```

---

## 🎯 **Supported Airports**

| Code | Airport Name | City | Country |
|------|-------------|------|---------|
| BKK | Suvarnabhumi Airport | Bangkok | Thailand |
| DMK | Don Mueang International Airport | Bangkok | Thailand |
| UTP | U-Tapao International Airport | Pattaya | Thailand |

---

## 📋 **Flight Data Schema**

```typescript
interface Flight {
  id: number;
  FlightNumber: string;
  Airline: string;
  AirlineIATA: string;
  AirlineICAO: string;
  Aircraft: string;
  FlightStatus: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted';
  FlightType: 'arrival' | 'departure';
  Airport: 'BKK' | 'DMK' | 'UTP';
  AirportName: string;
  OriginAirport: string;
  OriginAirportIATA: string;
  DestinationAirport: string;
  DestinationAirportIATA: string;
  ScheduledTime: string; // ISO datetime
  EstimatedTime?: string; // ISO datetime
  ActualTime?: string; // ISO datetime
  DelayMinutes: number;
  Terminal?: string;
  Gate?: string;
  Baggage?: string;
  FlightDate: string; // ISO date
  LastUpdated: string; // ISO datetime
  IsActive: boolean;
  Priority: number; // 1 = highest priority
}
```

---

## 🚀 **Production Notes**

1. **Rate Limiting**: AviationStack API has call limits - use cached endpoints for frequent requests
2. **Real-time Updates**: Set up polling intervals (5-10 minutes) for live data
3. **Error Handling**: Always implement fallback to cached data if live API fails
4. **Performance**: Use pagination and filtering to optimize data transfer
5. **Caching**: Implement client-side caching for better user experience
