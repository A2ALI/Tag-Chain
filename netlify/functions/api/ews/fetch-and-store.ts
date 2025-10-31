import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch farms with GPS coordinates
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('id, name, gps_lat, gps_lng')
      .not('gps_lat', 'is', null)
      .not('gps_lng', 'is', null);

    if (farmsError) {
      console.error('Error fetching farms:', farmsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch farms', details: farmsError.message })
      };
    }

    if (!farms || farms.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No farms found with GPS coordinates',
          forecastsInserted: 0,
          alertsGenerated: 0
        })
      };
    }

    let forecastsInserted = 0;
    let alertsGenerated = 0;

    // Process each farm
    for (const farm of farms) {
      // Skip if no GPS coordinates
      if (!farm.gps_lat || !farm.gps_lng) {
        console.warn(`Farm ${farm.id} missing GPS coordinates, skipping`);
        continue;
      }

      try {
        // Use OpenWeatherMap API if key is available
        if (process.env.OPENWEATHERMAP_API_KEY) {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/onecall?lat=${farm.gps_lat}&lon=${farm.gps_lng}&exclude=minutely&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`
          );
          
          if (!res.ok) {
            console.error(`Failed to fetch weather for farm ${farm.id}: ${res.status} ${res.statusText}`);
            continue;
          }

          const json = await res.json();

          // Store forecast data
          const forecastData = {
            farm_id: farm.id,
            provider: 'openweather',
            data: json,
            created_at: new Date().toISOString()
          };

          const { error: forecastError } = await supabase
            .from('ews_forecasts')
            .insert([forecastData]);

          if (forecastError) {
            console.error(`Error inserting forecast for farm ${farm.id}:`, forecastError);
          } else {
            forecastsInserted++;
          }

          // Compute disease risk using database rules
          if (json.daily && json.daily.length >= 3) {
            // Get disease rules from database
            const { data: rules, error: rulesError } = await supabase
              .from('ews_disease_rules')
              .select('*');
            
            if (rulesError) {
              console.error(`Error fetching disease rules for farm ${farm.id}:`, rulesError);
              continue;
            }
            
            // Apply each rule
            for (const rule of rules || []) {
              const conditions = rule.conditions_json;
              let riskDetected = false;
              let details = '';
              
              // Risk rule 1: Fungal disease (3-day avg humidity > 80% AND temperature 15–25°C)
              if (rule.disease === 'Lumpy Skin Disease' || rule.disease === 'Fungal Disease') {
                const avgHumidity = json.daily.slice(0, 3).reduce((sum: number, day: any) => sum + day.humidity, 0) / 3;
                
                if (avgHumidity > 80 && json.current?.temp >= 15 && json.current?.temp <= 25) {
                  riskDetected = true;
                  details = `3-day avg humidity: ${avgHumidity.toFixed(1)}%`;
                }
              }
              
              // Risk rule 2: Flood risk (wind speed > 20 m/s)
              if (rule.disease === 'Flood Risk') {
                if (json.current?.wind_speed > 20) {
                  riskDetected = true;
                  details = `Wind speed: ${json.current.wind_speed} m/s`;
                }
              }
              
              // Additional rules can be added here
              
              if (riskDetected) {
                const riskData = {
                  farm_id: farm.id,
                  disease: rule.disease,
                  confidence_score: 0.8, // Simplified confidence score
                  recommended_actions: rule.recommended_actions,
                  details,
                  created_at: new Date().toISOString()
                };

                const { error: riskError } = await supabase
                  .from('ews_disease_risk')
                  .insert([riskData]);

                if (!riskError) {
                  // Create alert
                  const alertData = {
                    farm_id: farm.id,
                    severity: rule.disease === 'Flood Risk' ? 'high' : 'medium',
                    type: 'DISEASE_RISK',
                    message: `${rule.disease} risk detected: ${details}`,
                    payload: {
                      disease: rule.disease,
                      confidence_score: 0.8,
                      recommended_actions: rule.recommended_actions
                    },
                    sent: false,
                    created_at: new Date().toISOString()
                  };

                  const { error: alertError } = await supabase
                    .from('ews_alerts')
                    .insert([alertData]);

                  if (!alertError) {
                    alertsGenerated++;
                  }
                }
              }
            }
          }
        } else {
          console.warn('OPENWEATHERMAP_API_KEY not set, skipping weather fetch');
        }
      } catch (weatherError) {
        console.error(`Error processing weather for farm ${farm.id}:`, weatherError);
        // Continue with next farm
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'EWS fetch and store completed',
        forecastsInserted,
        alertsGenerated
      })
    };
  } catch (error) {
    console.error('Error in EWS fetch-and-store:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}