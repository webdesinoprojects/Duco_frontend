// src/ContextAPI/PriceContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { getUpdatePricesByLocation } from "../Service/APIservice"; // ✅ use service file

// Create Context for price_increase, toConvert, and location
const PriceContext = createContext();

export const PriceProvider = ({ children }) => {
  const [toConvert, setToConvert] = useState(null);
  const [priceIncrease, setPriceIncrease] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!location) return; // Only run if location is set

    const fetchPriceData = async () => {
      try {
        const data = await getUpdatePricesByLocation(location); // ✅ reuse service
        if (data?.success) {
          setPriceIncrease(data.percentage);
          setToConvert(data.currency?.toconvert || null);
        } else {
          console.warn("⚠ No price data returned for location:", location);
        }
      } catch (error) {
        console.error("Error fetching price data:", error);
      }
    };

    fetchPriceData();
  }, [location]);

  return (
    <PriceContext.Provider value={{ toConvert, priceIncrease, setLocation }}>
      {children}
    </PriceContext.Provider>
  );
};

// Custom hook
export const usePriceContext = () => {
  return useContext(PriceContext);
};
