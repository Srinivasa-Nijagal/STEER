import React from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { Locate } from './Icons'; // Import the new icon from your Canvas file

const LocationInput = ({ label, value, onLocationSelect }) => {

    const loadOptions = async (searchQuery) => {
        if (searchQuery.length < 3) {
            return {
                options: [],
                hasMore: false,
            };
        }

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&countrycodes=in&limit=10&addressdetails=1`);
            const data = await res.json();
            
            const filteredData = data.filter(item => 
                ['suburb', 'neighbourhood', 'road', 'residential', 'hamlet', 'quarter', 'village', 'commercial', 'retail', 'industrial'].includes(item.type)
            );
            
            const options = (filteredData.length > 0 ? filteredData : data).map((item) => ({
                value: item, 
                label: item.display_name, 
            }));

            return {
                options: options,
                hasMore: false, 
            };

        } catch (error) {
            console.error("Error fetching suggestions:", error);
            return {
                options: [],
                hasMore: false,
            };
        }
    };

    const handleChange = (selectedOption) => {
        if (selectedOption) {
            const suggestion = selectedOption.value;
            onLocationSelect({
                lat: parseFloat(suggestion.lat),
                lon: parseFloat(suggestion.lon),
                address: suggestion.display_name,
            });
        }
    };
    
    // Function to get the user's current location
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Use reverse geocoding to get address from coordinates
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                if (data && data.display_name) {
                    onLocationSelect({
                        lat: latitude,
                        lon: longitude,
                        address: data.display_name,
                    });
                } else {
                    alert("Could not find an address for your location.");
                }
            } catch (error) {
                console.error("Reverse geocoding error:", error);
                alert("Failed to get an address for your location.");
            }
        }, () => {
            alert("Unable to retrieve your location. Please ensure location services are enabled.");
        });
    };
    
    const customStyles = {
        control: (provided) => ({
            ...provided,
            borderRadius: '0.5rem',
            borderColor: '#d1d5db',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            '&:hover': {
                borderColor: '#a5b4fc',
            },
        }),
        input: (provided) => ({
            ...provided,
            color: '#1f2937',
        }),
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative flex items-center space-x-2">
                <div className="flex-grow">
                    <AsyncPaginate
                        value={value ? { label: value, value: null } : null}
                        loadOptions={loadOptions}
                        onChange={handleChange}
                        placeholder="Search for an area or locality..."
                        debounceTimeout={600} 
                        styles={customStyles}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex-shrink-0"
                    title="Use my current location"
                >
                    <Locate className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        </div>
    );
};

export default LocationInput;

