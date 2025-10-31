// Climatrix provider adapter
export class ClimatrixProvider {
  async fetchForecast(lat: number, lon: number): Promise<any> {
    // In a real implementation, this would call the Climatrix API
    // For now, we'll return mock data similar to OpenWeather
    
    const mockData = {
      lat,
      lon,
      timezone: 'UTC',
      data: []
    };
    
    // Generate mock data for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      mockData.data.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          min: 20 + Math.random() * 5,
          max: 30 + Math.random() * 10,
          avg: 25 + Math.random() * 8
        },
        precipitation: {
          total: Math.random() * 20,
          probability: Math.random()
        },
        humidity: {
          min: 30 + Math.random() * 20,
          max: 80 + Math.random() * 20,
          avg: 50 + Math.random() * 30
        },
        wind: {
          speed: Math.random() * 15,
          direction: Math.random() * 360
        },
        pressure: 1013 + Math.random() * 20 - 10,
        uv_index: Math.random() * 10,
        cloud_cover: Math.random() * 100
      });
    }
    
    return mockData;
  }
}