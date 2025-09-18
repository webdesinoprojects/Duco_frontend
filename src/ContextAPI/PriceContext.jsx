import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Context for price_increase, toConvert, and location
const PriceContext = createContext();

// Create a Provider component
export const PriceProvider = ({ children }) => {
  const [toConvert, setToConvert] = useState(null);
  const [priceIncrease, setPriceIncrease] = useState(null);
  const [location, setLocation] = useState(null); // Add location state

  const API_BASE = 'https://duco-backend.onrender.com/';

  useEffect(() => {
    if (!location) return; // Only run if location is set

    const fetchPriceData = async () => {
      try {
        // Fetch price data based on the current location using Axios
        const response = await axios.post(`https://duco-backend.onrender.com/money/get_location_increase`, {
          location,  // Ensure `location` is properly defined
        });

        // Extract price data and currency conversion rate
        const data = response.data;
        setPriceIncrease(data.percentage);  // Set the price increase
        setToConvert(data.currency.toconvert);  // Set the conversion rate

      } catch (error) {
        console.error('Error fetching price data:', error);
        // Handle error (e.g., show error message to the user)
      }
    };

    fetchPriceData();
  }, [location]); // Dependency on location to trigger the effect when it changes


  return (
    <PriceContext.Provider value={{ toConvert, priceIncrease, setLocation }}>
      {children}
    </PriceContext.Provider>
  );
};

// Custom hook to use the context
export const usePriceContext = () => {
  return useContext(PriceContext);
};
