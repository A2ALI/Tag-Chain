import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Rate limiter for provider calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number = 30 * 60 * 1000; // 30 minutes
  private maxRequests: number = 10;

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// Provider adapters
interface WeatherForecast {
  timestamp: Date;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

interface DiseaseRisk {
  disease: string;
  confidenceScore: number;
  recommendedActions: string;
}

interface EWSConfig {
  drySpellDays: number;
  heatStressTemp: number;
  floodRiskPrecip: number;
}

const ewsConfig: EWSConfig = {
  drySpellDays: 7,
  heatStressTemp: 35,
  floodRiskPrecip: 50
};

// Main EWS Service
export class EWSService {
  async fetchForecasts(farmId: string, coordinates: { lat: number; lon: number }): Promise<WeatherForecast[]> {
    try {
      // Check rate limit
      if (!rateLimiter.isAllowed(`forecast-${farmId}`)) {
        throw new Error('Rate limit exceeded for forecast requests');
      }

      // Use OpenWeatherMap API if key is available
      if (process.env.OPENWEATHERMAP_API_KEY) {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/onecall?lat=${coordinates.lat}&lon=${coordinates.lon}&exclude=minutely,hourly&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`
        );
        
        if (!res.ok) {
          throw new Error(`Failed to fetch weather data: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        
        // Transform OpenWeatherMap data to our format
        const forecasts: WeatherForecast[] = [];
        
        // Process current weather
        if (json.current) {
          forecasts.push({
            timestamp: new Date(json.current.dt * 1000),
            temperature: json.current.temp,
            precipitation: json.current.rain ? json.current.rain['1h'] || 0 : 0,
            windSpeed: json.current.wind_speed || 0,
            humidity: json.current.humidity
          });
        }
        
        // Process daily forecasts
        if (json.daily && Array.isArray(json.daily)) {
          for (const day of json.daily.slice(0, 7)) { // Limit to 7 days
            forecasts.push({
              timestamp: new Date(day.dt * 1000),
              temperature: day.temp.day,
              precipitation: day.rain || 0,
              windSpeed: day.wind_speed || 0,
              humidity: day.humidity
            });
          }
        }
        
        return forecasts;
      } else {
        // Fallback to mock data if no API key
        console.warn('OPENWEATHERMAP_API_KEY not set, using mock data');
        const mockForecasts: WeatherForecast[] = [];
        const now = new Date();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() + i);
          
          mockForecasts.push({
            timestamp: date,
            temperature: 25 + Math.random() * 10,
            precipitation: Math.random() * 20,
            windSpeed: Math.random() * 15,
            humidity: 40 + Math.random() * 40
          });
        }
        
        return mockForecasts;
      }
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      throw error;
    }
  }

  async persistForecasts(farmId: string, forecasts: WeatherForecast[], provider: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ews_forecasts')
        .insert(
          forecasts.map(forecast => ({
            farm_id: farmId,
            provider,
            data: forecast,
            generated_at: new Date()
          }))
        );

      if (error) {
        throw new Error(`Failed to persist forecasts: ${error.message}`);
      }
    } catch (error) {
      console.error('Error persisting forecasts:', error);
      throw error;
    }
  }

  async computeDiseaseRisk(farmId: string, forecasts: WeatherForecast[]): Promise<DiseaseRisk[]> {
    const risks: DiseaseRisk[] = [];
    
    // Simple heuristic-based risk computation
    // In a real implementation, this would be more sophisticated
    
    // Check for heat stress risk
    const heatStressDays = forecasts.filter(f => f.temperature > ewsConfig.heatStressTemp).length;
    if (heatStressDays > 2) {
      risks.push({
        disease: 'Heat Stress',
        confidenceScore: Math.min(0.9, heatStressDays / 7),
        recommendedActions: 'Provide shade, increase water availability, reduce activity during peak hours'
      });
    }
    
    // Check for flood risk
    const highWindDays = forecasts.filter(f => f.windSpeed > 20).length;
    if (highWindDays > 1) {
      risks.push({
        disease: 'Flood Risk',
        confidenceScore: Math.min(0.8, highWindDays / 7),
        recommendedActions: 'Check drainage, move animals to higher ground, ensure feed storage is protected'
      });
    }
    
    // Check for dry spell risk
    const dryDays = forecasts.filter(f => f.precipitation < 1).length;
    if (dryDays >= ewsConfig.drySpellDays) {
      risks.push({
        disease: 'Drought Risk',
        confidenceScore: Math.min(0.7, dryDays / 14),
        recommendedActions: 'Conserve water, stock up on feed, check water sources'
      });
    }
    
    // Check for fungal disease risk (3-day avg humidity > 80% AND temperature 15–25°C)
    if (forecasts.length >= 3) {
      const recentForecasts = forecasts.slice(0, 3);
      const avgHumidity = recentForecasts.reduce((sum, f) => sum + f.humidity, 0) / 3;
      const avgTemp = recentForecasts.reduce((sum, f) => sum + f.temperature, 0) / 3;
      
      if (avgHumidity > 80 && avgTemp >= 15 && avgTemp <= 25) {
        risks.push({
          disease: 'Fungal Disease',
          confidenceScore: Math.min(0.9, avgHumidity / 100),
          recommendedActions: 'Check animals for signs of fungal infections and improve ventilation'
        });
      }
    }
    
    return risks;
  }

  async generateAlerts(farmId: string, risks: DiseaseRisk[]): Promise<void> {
    try {
      const alerts = risks.map(risk => ({
        farm_id: farmId,
        severity: risk.confidenceScore > 0.7 ? 'HIGH' : risk.confidenceScore > 0.4 ? 'MEDIUM' : 'LOW',
        type: 'DISEASE_RISK',
        message: `Risk of ${risk.disease} detected with ${Math.round(risk.confidenceScore * 100)}% confidence`,
        payload: {
          disease: risk.disease,
          confidence_score: risk.confidenceScore,
          recommended_actions: risk.recommendedActions
        },
        sent: false,
        created_at: new Date()
      }));

      const { error } = await supabase
        .from('ews_alerts')
        .insert(alerts);

      if (error) {
        throw new Error(`Failed to generate alerts: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating alerts:', error);
      throw error;
    }
  }

  async processFarm(farmId: string, coordinates: { lat: number; lon: number }): Promise<void> {
    try {
      // Fetch forecasts
      const forecasts = await this.fetchForecasts(farmId, coordinates);
      
      // Persist forecasts
      await this.persistForecasts(farmId, forecasts, process.env.EWS_PROVIDER || 'openweather');
      
      // Compute disease risks
      const risks = await this.computeDiseaseRisk(farmId, forecasts);
      
      // Generate alerts
      await this.generateAlerts(farmId, risks);
      
      console.log(`Processed EWS for farm ${farmId}: ${forecasts.length} forecasts, ${risks.length} risks, ${risks.length} alerts`);
    } catch (error) {
      console.error(`Error processing farm ${farmId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const ewsService = new EWSService();