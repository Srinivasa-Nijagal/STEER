import fetch from 'node-fetch';

const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY;

export const getRoute = async (req, res) => {
    try {
        if (!OPENROUTESERVICE_API_KEY) {
            throw new Error('OpenRouteService API key is not configured on the server.');
        }

        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Content-Type': 'application/json',
                'Authorization': OPENROUTESERVICE_API_KEY
            },
            body: JSON.stringify(req.body) 
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }
        
        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("Proxy routing error:", error);
        res.status(500).json({ error: { message: error.message || 'Server error in proxy.' } });
    }
};

