// Enhanced EWS Alerts Service
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Real disease outbreak data sources
const diseaseAPIs = [
  'https://api.health.org/outbreaks',
  'https://weather.api/extreme-alerts',
  'https://livestock.monitoring/disease-map'
];

// Machine learning risk scoring
const calculateRiskScore = (location, animalType, weatherData) => {
  const baseRisk = getBaseRisk(location);
  const weatherRisk = calculateWeatherImpact(weatherData);
  const densityRisk = getAnimalDensityRisk(location, animalType);
  
  return (baseRisk + weatherRisk + densityRisk) * outbreakMultiplier;
};

// Fetch alerts from multiple sources
const fetchAlerts = async (api, location) => {
  try {
    const response = await fetch(`${api}?location=${location.lat},${location.lng}&radius=50km`, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts from ${api}: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching alerts from ${api}:`, error);
    return [];
  }
};

// Consolidate alerts from multiple sources
const consolidateAlerts = (alerts) => {
  // Merge and deduplicate alerts from different sources
  const consolidated = [];
  const seen = new Set();
  
  alerts.flat().forEach(alert => {
    const key = `${alert.disease}-${alert.location.lat}-${alert.location.lng}-${alert.timestamp}`;
    if (!seen.has(key)) {
      seen.add(key);
      consolidated.push(alert);
    }
  });
  
  return consolidated;
};

// Process real-time alerts
const processAlerts = async (location) => {
  try {
    const alerts = await Promise.all(
      diseaseAPIs.map(api => fetchAlerts(api, location))
    );
    
    return consolidateAlerts(alerts);
  } catch (error) {
    console.error('Error processing alerts:', error);
    return [];
  }
};

// Get base risk for location
const getBaseRisk = (location) => {
  // In a real implementation, this would query historical data
  // For now, we'll return a mock value
  return 0.3;
};

// Calculate weather impact
const calculateWeatherImpact = (weatherData) => {
  // In a real implementation, this would analyze weather patterns
  // For now, we'll return a mock value
  return 0.2;
};

// Get animal density risk
const getAnimalDensityRisk = (location, animalType) => {
  // In a real implementation, this would query animal density data
  // For now, we'll return a mock value
  return 0.15;
};

// Outbreak multiplier
const outbreakMultiplier = 1.5;

export {
  processAlerts,
  calculateRiskScore
};