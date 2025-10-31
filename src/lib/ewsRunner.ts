import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ewsService } from './ewsService';
import { diseaseMappingService } from './diseaseMappingService';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class EWSRunner {
  async runOnce() {
    try {
      console.log('=== Running EWS Once ===');
      
      // Fetch all farms from the database
      const { data: farms, error } = await supabase
        .from('farms')
        .select('id, gps_lat, gps_lng');
      
      if (error) {
        throw new Error(`Failed to fetch farms: ${error.message}`);
      }
      
      if (!farms || farms.length === 0) {
        console.log('No farms found in database');
        return;
      }
      
      console.log(`Processing EWS for ${farms.length} farms`);
      
      // Process each farm
      for (const farm of farms) {
        try {
          // Skip farms without coordinates
          if (!farm.gps_lat || !farm.gps_lng) {
            console.log(`Skipping farm ${farm.id} due to missing coordinates`);
            continue;
          }
          
          // Fetch forecasts using the EWS service
          const forecasts = await ewsService.fetchForecasts(
            farm.id,
            { lat: farm.gps_lat, lon: farm.gps_lng }
          );
          
          // Persist forecasts
          await ewsService.persistForecasts(
            farm.id, 
            forecasts, 
            process.env.EWS_PROVIDER || 'openweather'
          );
          
          // Compute disease risks using the disease mapping service
          const risks = await diseaseMappingService.mapWeatherToDiseases(forecasts, farm);
          
          // Store disease risks
          await diseaseMappingService.storeDiseaseRisks(farm.id, risks);
          
          // Generate alerts
          await ewsService.generateAlerts(farm.id, risks);
          
          console.log(`Processed EWS for farm ${farm.id}: ${forecasts.length} forecasts, ${risks.length} risks, ${risks.length} alerts`);
        } catch (error) {
          console.error(`Error processing farm ${farm.id}:`, error);
        }
      }
      
      console.log('✅ EWS run completed successfully');
    } catch (error) {
      console.error('❌ EWS run failed:', error);
      throw error;
    }
  }

  async runCron() {
    try {
      console.log('=== Running EWS Cron Job ===');
      
      // This would be called periodically by a cron scheduler
      await this.runOnce();
      
      console.log('✅ EWS cron job completed');
    } catch (error) {
      console.error('❌ EWS cron job failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ewsRunner = new EWSRunner();

// If run directly, execute the runner
// Note: In ES modules, we can't use require.main, so we'll use import.meta.url
if (import.meta.url === `file://${process.argv[1]}`) {
  ewsRunner.runOnce().catch(error => {
    console.error('EWS runner failed:', error);
    process.exit(1);
  });
}