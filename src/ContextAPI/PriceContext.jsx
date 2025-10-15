// src/ContextAPI/PriceContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { getUpdatePricesByLocation } from "../Service/APIservice";

const PriceContext = createContext();

export const PriceProvider = ({ children }) => {
  const [toConvert, setToConvert] = useState(null); // conversion rate
  const [priceIncrease, setPriceIncrease] = useState(null); // % increase
  const [currency, setCurrency] = useState(null); // currency code (USD, INR, etc.)
  const [resolvedLocation, setResolvedLocation] = useState(null); // e.g. India
  const [location, setLocation] = useState(null); // detected country

  /* 🌍 Auto-detect location on mount */
  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) {
        console.warn("❌ Geolocation not supported.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
            if (!apiKey) {
              console.error("❌ Missing Google API Key. Check your .env file.");
              return;
            }

            const geoURL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
            const res = await axios.get(geoURL);
            const results = res.data.results || [];

            let country = null;

            // ✅ Loop through all results and their components
            for (const result of results) {
              for (const comp of result.address_components) {
                if (comp.types.includes("country")) {
                  country = comp.long_name; // e.g. "India"
                  break;
                }
              }
              if (country) break; // stop once found
            }

            if (country) {
              console.log("🌍 Detected country:", country);
              setLocation(country);
            } else {
              console.warn("⚠️ No country found. Setting fallback: Unknown");
              setLocation("Unknown");
            }
          } catch (err) {
            console.error("❌ Location detection failed:", err);
            setLocation("Unknown");
          }
        },
        (err) => {
          console.warn("❌ Geolocation error:", err.message);
          setLocation("Unknown");
        }
      );
    };

    detectLocation();
  }, []);

  /* 🏷 Fetch price data whenever location is detected */
  useEffect(() => {
    if (!location) return;

    const fetchPriceData = async () => {
      try {
        console.log("📦 Fetching price data for:", location);
        const data = await getUpdatePricesByLocation(location);

        if (data?.success) {
          setPriceIncrease(data.percentage);
          setToConvert(data.currency?.toconvert || null);
          setCurrency(data.currency?.country || null);
          setResolvedLocation(data.location);
        } else {
          console.warn("⚠ No price data for location:", location);
        }
      } catch (error) {
        console.error("❌ Error fetching price data:", error);
      }
    };

    fetchPriceData();
  }, [location]);

  return (
    <PriceContext.Provider
      value={{
        toConvert,
        priceIncrease,
        currency,
        resolvedLocation,
        setLocation, // still exposed if you want manual override
      }}
    >
      {children}
    </PriceContext.Provider>
  );
};

export const usePriceContext = () => useContext(PriceContext);
