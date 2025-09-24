// Haversine formula to calculate distance between two lat/lon points
export const haversineDistance = (coords1, coords2) => {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    const R = 6371; // Earth's radius in km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lon - coords1.lon);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

// Simple fare calculation
export const calculateFare = (distance) => {
    const baseFare = 50; // Base fare in INR
    const ratePerKm = 8; // Rate per km in INR
    return Math.round(baseFare + (distance * ratePerKm));
};

// Calculates the shortest distance from a point to a line segment
const pointToLineSegmentDistance = (point, lineStart, lineEnd) => {
    const A = point.lat - lineStart.lat;
    const B = point.lon - lineStart.lon;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lon - lineStart.lon;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) {
        param = dot / len_sq;
    }

    let xx, yy;
    if (param < 0) {
        xx = lineStart.lat;
        yy = lineStart.lon;
    } else if (param > 1) {
        xx = lineEnd.lat;
        yy = lineEnd.lon;
    } else {
        xx = lineStart.lat + param * C;
        yy = lineStart.lon + param * D;
    }

    return haversineDistance(point, { lat: xx, lon: yy });
};

// Finds the closest point on a route (a series of line segments) to a given point
export const findClosestPointOnRoute = (point, routeCoordinates) => {
    let minDistance = Infinity;
    let closestPointIndex = -1;

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
        const lineStart = { lat: routeCoordinates[i][1], lon: routeCoordinates[i][0] };
        const lineEnd = { lat: routeCoordinates[i + 1][1], lon: routeCoordinates[i + 1][0] };
        
        const distance = pointToLineSegmentDistance(point, lineStart, lineEnd);
        
        if (distance < minDistance) {
            minDistance = distance;
            // A simple approximation for the closest point index
            closestPointIndex = i; 
        }
    }
    
    return { distance: minDistance, index: closestPointIndex };
};

