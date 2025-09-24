import React from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';

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
                value: item, // The entire suggestion object
                label: item.display_name, // The text displayed in the dropdown
            }));

            return {
                options: options,
                hasMore: false, // We are not using pagination in this case
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
    
    // Custom styles to make the component blend with the app's design
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
            <AsyncPaginate
                value={value ? { label: value, value: null } : null}
                loadOptions={loadOptions}
                onChange={handleChange}
                placeholder="Search for an area or locality..."
                debounceTimeout={600} // Built-in debounce
                styles={customStyles}
            />
        </div>
    );
};

export default LocationInput;

