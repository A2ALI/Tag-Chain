import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Disease rule interface
interface DiseaseRule {
  id: string;
  disease: string;
  conditions_json: any;
  recommended_actions: string;
}

// Weather forecast interface
interface WeatherForecast {
  timestamp: Date;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

// Disease risk interface
interface DiseaseRisk {
  disease: string;
  confidenceScore: number;
  recommendedActions: string;
}

export class DiseaseMappingService {
  async getDiseaseRules(): Promise<DiseaseRule[]> {
    try {
      const { data, error } = await supabase
        .from('ews_disease_rules')
        .select('*');
      
      if (error) {
        throw new Error(`Failed to fetch disease rules: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching disease rules:', error);
      throw error;
    }
  }

  async mapWeatherToDiseases(forecast: WeatherForecast[], farmProfile: any): Promise<DiseaseRisk[]> {
    try {
      // Get disease rules from database
      const rules = await this.getDiseaseRules();
      
      const risks: DiseaseRisk[] = [];
      
      // Apply each rule to the forecast data
      for (const rule of rules) {
        const risk = this.applyRule(rule, forecast, farmProfile);
        if (risk) {
          risks.push(risk);
        }
      }
      
      return risks;
    } catch (error) {
      console.error('Error mapping weather to diseases:', error);
      throw error;
    }
  }

  private applyRule(rule: DiseaseRule, forecast: WeatherForecast[], farmProfile: any): DiseaseRisk | null {
    try {
      const conditions = rule.conditions_json;
      
      // Calculate confidence score based on how well conditions match
      let confidenceScore = 0;
      let matchedConditions = 0;
      let totalConditions = 0;
      
      // Check temperature conditions
      if (conditions.temp_min !== undefined) {
        totalConditions++;
        const tempMatches = forecast.some(f => f.temperature >= conditions.temp_min);
        if (tempMatches) matchedConditions++;
      }
      
      if (conditions.temp_max !== undefined) {
        totalConditions++;
        const tempMatches = forecast.some(f => f.temperature <= conditions.temp_max);
        if (tempMatches) matchedConditions++;
      }
      
      // Check humidity conditions
      if (conditions.humidity_min !== undefined) {
        totalConditions++;
        const humidityMatches = forecast.some(f => f.humidity >= conditions.humidity_min);
        if (humidityMatches) matchedConditions++;
      }
      
      // Check precipitation conditions
      if (conditions.precipitation_min !== undefined) {
        totalConditions++;
        const precipMatches = forecast.some(f => f.precipitation >= conditions.precipitation_min);
        if (precipMatches) matchedConditions++;
      }
      
      if (conditions.precipitation_max !== undefined) {
        totalConditions++;
        const precipMatches = forecast.some(f => f.precipitation <= conditions.precipitation_max);
        if (precipMatches) matchedConditions++;
      }
      
      // Check wind speed conditions
      if (conditions.wind_speed_min !== undefined) {
        totalConditions++;
        const windMatches = forecast.some(f => f.windSpeed >= conditions.wind_speed_min);
        if (windMatches) matchedConditions++;
      }
      
      // Check duration conditions
      if (conditions.duration_days !== undefined) {
        totalConditions++;
        const consecutiveDays = this.countConsecutiveDays(forecast, conditions);
        if (consecutiveDays >= conditions.duration_days) matchedConditions++;
      }
      
      // Calculate confidence score
      if (totalConditions > 0) {
        confidenceScore = matchedConditions / totalConditions;
      }
      
      // Only return risk if confidence is above threshold
      if (confidenceScore > 0.3) {
        return {
          disease: rule.disease,
          confidenceScore,
          recommendedActions: rule.recommended_actions
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error applying rule for ${rule.disease}:`, error);
      return null;
    }
  }

  private countConsecutiveDays(forecast: WeatherForecast[], conditions: any): number {
    let count = 0;
    
    // Count days matching temperature conditions
    if (conditions.temp_min !== undefined) {
      count = Math.max(count, forecast.filter(f => f.temperature >= conditions.temp_min).length);
    }
    
    // Count days matching precipitation conditions
    if (conditions.precipitation_min !== undefined) {
      count = Math.max(count, forecast.filter(f => f.precipitation >= conditions.precipitation_min).length);
    }
    
    // Count days matching humidity conditions
    if (conditions.humidity_min !== undefined) {
      count = Math.max(count, forecast.filter(f => f.humidity >= conditions.humidity_min).length);
    }
    
    // Count days matching wind speed conditions
    if (conditions.wind_speed_min !== undefined) {
      count = Math.max(count, forecast.filter(f => f.windSpeed >= conditions.wind_speed_min).length);
    }
    
    return count;
  }

  async storeDiseaseRisks(farmId: string, risks: DiseaseRisk[], forecastId?: string): Promise<void> {
    try {
      const riskRecords = risks.map(risk => ({
        farm_id: farmId,
        disease: risk.disease,
        confidence_score: risk.confidenceScore,
        recommended_actions: risk.recommendedActions,
        forecast_id: forecastId
      }));
      
      const { error } = await supabase
        .from('ews_disease_risk')
        .insert(riskRecords);
      
      if (error) {
        throw new Error(`Failed to store disease risks: ${error.message}`);
      }
      
      console.log(`Stored ${riskRecords.length} disease risk records for farm ${farmId}`);
    } catch (error) {
      console.error('Error storing disease risks:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const diseaseMappingService = new DiseaseMappingService();