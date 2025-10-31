// OpenWeather provider adapter
export class OpenWeatherProvider {
  async fetchForecast(lat: number, lon: number): Promise<any> {
    // In a real implementation, this would call the OpenWeather API
    // For now, we'll return mock data
    
    const mockData = {
      lat,
      lon,
      timezone: 'UTC',
      hourly: [],
      daily: []
    };
    
    // Generate mock hourly data
    for (let i = 0; i < 48; i++) {
      mockData.hourly.push({
        dt: Date.now() + i * 3600000,
        temp: 25 + Math.random() * 10,
        feels_like: 25 + Math.random() * 10,
        pressure: 1013 + Math.random() * 20 - 10,
        humidity: 40 + Math.random() * 40,
        dew_point: 15 + Math.random() * 10,
        clouds: Math.random() * 100,
        visibility: 10000,
        wind_speed: Math.random() * 15,
        wind_deg: Math.random() * 360,
        wind_gust: Math.random() * 20,
        weather: [{
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }],
        pop: Math.random()
      });
    }
    
    // Generate mock daily data
    for (let i = 0; i < 7; i++) {
      mockData.daily.push({
        dt: Date.now() + i * 86400000,
        sunrise: Date.now() + i * 86400000 + 21600000,
        sunset: Date.now() + i * 86400000 + 64800000,
        temp: {
          day: 25 + Math.random() * 10,
          min: 20 + Math.random() * 5,
          max: 30 + Math.random() * 10,
          night: 20 + Math.random() * 5,
          eve: 25 + Math.random() * 8,
          morn: 22 + Math.random() * 6
        },
        feels_like: {
          day: 25 + Math.random() * 10,
          night: 20 + Math.random() * 5,
          eve: 25 + Math.random() * 8,
          morn: 22 + Math.random() * 6
        },
        pressure: 1013 + Math.random() * 20 - 10,
        humidity: 40 + Math.random() * 40,
        dew_point: 15 + Math.random() * 10,
        wind_speed: Math.random() * 15,
        wind_deg: Math.random() * 360,
        weather: [{
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }],
        clouds: Math.random() * 100,
        pop: Math.random(),
        uvi: Math.random() * 10
      });
    }
    
    return mockData;
  }
}