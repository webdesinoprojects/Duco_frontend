import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Context for price_increase, toConvert, and location
const PriceContext = createContext();

// Default values for fallback
const DEFAULT_VALUES = {
  toConvert: 1, // Default conversion rate (no conversion)
  priceIncrease: 0, // Default price increase (no markup)
  location: 'Asia', // Default location
};

// Create a Provider component
export const PriceProvider = ({ children }) => {
  const [toConvert, setToConvert] = useState(DEFAULT_VALUES.toConvert);
  const [priceIncrease, setPriceIncrease] = useState(
    DEFAULT_VALUES.priceIncrease
  );
  const [location, setLocation] = useState(DEFAULT_VALUES.location);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = 'http://localhost:3000/';

  // Initialize with default values and try to fetch real data
  useEffect(() => {
    const initializePriceData = async () => {
      setIsLoading(true);

      try {
        // First, try to get user's location
        const geoResponse = await axios.get('https://ipapi.co/json/');
        const continentMapping = {
          IN: 'Asia',
          US: 'North America',
          GB: 'Europe',
          AU: 'Australia',
        };
        const detectedLocation =
          continentMapping[geoResponse.data?.country] || 'Asia';

        // Set location first
        setLocation(detectedLocation);

        // Try to fetch price data for this location
        try {
          const response = await axios.post(
            `${API_BASE}money/get_location_increase`,
            { location: detectedLocation }
          );

          // Extract price data and currency conversion rate
          const data = response.data;
          if (
            data &&
            data.percentage !== undefined &&
            data.currency?.toconvert !== undefined
          ) {
            setPriceIncrease(data.percentage);
            setToConvert(data.currency.toconvert);
            console.log('✅ Price data loaded:', {
              location: detectedLocation,
              toConvert: data.currency.toconvert,
              priceIncrease: data.percentage,
            });
          } else {
            console.warn('⚠️ Invalid price data received, using defaults');
          }
        } catch (apiError) {
          console.warn(
            '⚠️ Price API not available, using defaults for',
            detectedLocation
          );
          // Use location-specific defaults
          const locationDefaults = {
            Asia: { toConvert: 1, priceIncrease: 0 },
            'North America': { toConvert: 0.012, priceIncrease: 20 },
            Europe: { toConvert: 0.0095, priceIncrease: 15 },
            Australia: { toConvert: 0.018, priceIncrease: 18 },
          };

          const defaults =
            locationDefaults[detectedLocation] || locationDefaults['Asia'];
          setToConvert(defaults.toConvert);
          setPriceIncrease(defaults.priceIncrease);
          console.log('✅ Using location defaults:', {
            location: detectedLocation,
            toConvert: defaults.toConvert,
            priceIncrease: defaults.priceIncrease,
          });
        }
      } catch (error) {
        console.error(
          '❌ Error detecting location, using Asia defaults:',
          error.message
        );
        // Keep default values on error
      } finally {
        setIsLoading(false);
      }
    };

    initializePriceData();
  }, []); // Run once on mount

  // Handle manual location changes
  const handleSetLocation = async (newLocation) => {
    if (!newLocation || newLocation === location) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}money/get_location_increase`,
        { location: newLocation }
      );

      const data = response.data;
      if (
        data &&
        data.percentage !== undefined &&
        data.currency?.toconvert !== undefined
      ) {
        setLocation(newLocation);
        setPriceIncrease(data.percentage);
        setToConvert(data.currency.toconvert);
        console.log('✅ Location updated:', {
          location: newLocation,
          toConvert: data.currency.toconvert,
          priceIncrease: data.percentage,
        });
      }
    } catch (error) {
      console.error('❌ Error updating location:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PriceContext.Provider
      value={{
        toConvert,
        priceIncrease,
        location,
        isLoading,
        setLocation: handleSetLocation,
      }}
    >
      {children}
    </PriceContext.Provider>
  );
};

// Custom hook to use the context
export const usePriceContext = () => {
  return useContext(PriceContext);
};
