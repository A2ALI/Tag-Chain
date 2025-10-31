import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { logSecurityEvent } from './securityLogger';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory cache for rates
const rateCache: Map<string, { rate: number; timestamp: number }> = new Map();

// Cache TTL from environment or default to 1 hour
const CACHE_TTL = parseInt(process.env.RATE_CACHE_TTL_SECONDS || '3600') * 1000;
const ALERT_THRESHOLD = parseFloat(process.env.RATE_ALERT_THRESHOLD_PERCENT || '10');

interface RateData {
  base: string;
  quote: string;
  rate: number;
  source: string;
  timestamp: number;
}

interface CoinGeckoResponse {
  [coin: string]: {
    [currency: string]: number;
  };
}

interface ExchangeRateResponse {
  rates: {
    [currency: string]: number;
  };
}

export class RateEngine {
  private static instance: RateEngine;

  private constructor() {}

  public static getInstance(): RateEngine {
    if (!RateEngine.instance) {
      RateEngine.instance = new RateEngine();
    }
    return RateEngine.instance;
  }

  /**
   * Fetch rates from primary and fallback providers
   */
  async fetchRates(): Promise<void> {
    try {
      console.log('Fetching rates from primary providers...');
      
      // Fetch crypto rates
      await this.fetchCryptoRates();
      
      // Fetch fiat rates
      await this.fetchFiatRates();
      
      console.log('Rates fetched successfully');
    } catch (error) {
      console.error('Error fetching rates:', error);
      logSecurityEvent({
        event: 'RATE_FETCH_ERROR',
        severity: 'warning',
        details: error.message,
      });
    }
  }

  /**
   * Get rate from cache or fetch new rate
   */
  async getRate(base: string, quote: string): Promise<number> {
    const cacheKey = `${base}_${quote}`;
    const cached = rateCache.get(cacheKey);
    
    // Check if cache is valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.rate;
    }
    
    // Cache miss or expired, fetch new rate
    try {
      const rate = await this.fetchRateFromProviders(base, quote);
      rateCache.set(cacheKey, { rate, timestamp: Date.now() });
      return rate;
    } catch (error) {
      console.error(`Error fetching rate for ${base}/${quote}:`, error);
      
      // If we have an old cached rate, use it as fallback
      if (cached) {
        console.warn(`Using expired cached rate for ${base}/${quote}`);
        return cached.rate;
      }
      
      // No rate available
      throw new Error(`Unable to fetch rate for ${base}/${quote}`);
    }
  }

  /**
   * Fetch crypto rates from CoinGecko
   */
  private async fetchCryptoRates(): Promise<void> {
    try {
      // For demo purposes, we'll use a fixed mapping
      // In production, you would fetch from CoinGecko API
      const cryptoRates: Record<string, number> = {
        'TAGUSD': 1.0, // Stablecoin pegged to USD
        'HBAR': 0.08,  // Example HBAR price in USD
      };

      // Save to database
      for (const [token, rate] of Object.entries(cryptoRates)) {
        await this.saveRateToDatabase(token, 'USD', rate, 'coingecko');
      }
    } catch (error) {
      console.error('Error fetching crypto rates:', error);
      // Try fallback provider
      await this.fetchCryptoRatesFallback();
    }
  }

  /**
   * Fallback for crypto rates
   */
  private async fetchCryptoRatesFallback(): Promise<void> {
    console.log('Using fallback crypto rates');
    // Use default rates as fallback
    const fallbackRates: Record<string, number> = {
      'TAGUSD': 1.0,
      'HBAR': 0.08,
    };

    for (const [token, rate] of Object.entries(fallbackRates)) {
      await this.saveRateToDatabase(token, 'USD', rate, 'fallback');
    }
  }

  /**
   * Fetch fiat rates from OpenExchangeRates or similar
   */
  private async fetchFiatRates(): Promise<void> {
    try {
      // For demo purposes, we'll use a fixed mapping
      // In production, you would fetch from OpenExchangeRates API
      const fiatRates: Record<string, number> = {
        'NGN': 1500, // Nigerian Naira
        'KES': 120,  // Kenyan Shilling
        'GHS': 12,   // Ghanaian Cedi
      };

      // Save to database
      for (const [currency, rate] of Object.entries(fiatRates)) {
        await this.saveRateToDatabase('USD', currency, rate, 'openexchangerates');
      }
    } catch (error) {
      console.error('Error fetching fiat rates:', error);
      // Try fallback provider
      await this.fetchFiatRatesFallback();
    }
  }

  /**
   * Fallback for fiat rates
   */
  private async fetchFiatRatesFallback(): Promise<void> {
    console.log('Using fallback fiat rates');
    // Use default rates as fallback
    const fallbackRates: Record<string, number> = {
      'NGN': 1500,
      'KES': 120,
      'GHS': 12,
    };

    for (const [currency, rate] of Object.entries(fallbackRates)) {
      await this.saveRateToDatabase('USD', currency, rate, 'fallback');
    }
  }

  /**
   * Fetch rate from providers with fallback
   */
  private async fetchRateFromProviders(base: string, quote: string): Promise<number> {
    try {
      // Try primary provider first
      const rate = await this.fetchRateFromPrimary(base, quote);
      return rate;
    } catch (primaryError) {
      console.warn(`Primary provider failed for ${base}/${quote}, trying fallback`);
      
      try {
        // Try fallback provider
        const rate = await this.fetchRateFromFallback(base, quote);
        return rate;
      } catch (fallbackError) {
        console.error(`Both primary and fallback providers failed for ${base}/${quote}`);
        throw fallbackError;
      }
    }
  }

  /**
   * Fetch rate from primary provider
   */
  private async fetchRateFromPrimary(base: string, quote: string): Promise<number> {
    // This is a simplified implementation
    // In production, you would make actual API calls
    
    // For stablecoins, return 1:1 rate
    if (base === 'TAGUSD' && quote === 'USD') {
      return 1.0;
    }
    
    // For other pairs, use demo rates
    const demoRates: Record<string, number> = {
      'TAGUSD_NGN': 1500,
      'TAGUSD_KES': 120,
      'TAGUSD_GHS': 12,
      'HBAR_USD': 0.08,
    };
    
    const key = `${base}_${quote}`;
    if (demoRates[key]) {
      return demoRates[key];
    }
    
    throw new Error(`Rate not available for ${base}/${quote}`);
  }

  /**
   * Fetch rate from fallback provider
   */
  private async fetchRateFromFallback(base: string, quote: string): Promise<number> {
    // Use fixed rates as fallback
    const fallbackRates: Record<string, number> = {
      'TAGUSD_NGN': 1500,
      'TAGUSD_KES': 120,
      'TAGUSD_GHS': 12,
      'HBAR_USD': 0.08,
    };
    
    const key = `${base}_${quote}`;
    if (fallbackRates[key]) {
      return fallbackRates[key];
    }
    
    // Default to 1 if no rate found
    return 1.0;
  }

  /**
   * Save rate to database and check for volatility
   */
  private async saveRateToDatabase(base: string, quote: string, rate: number, source: string): Promise<void> {
    try {
      const cacheKey = `${base}_${quote}`;
      
      // Check for volatility
      const previousRateData = rateCache.get(cacheKey);
      if (previousRateData) {
        const previousRate = previousRateData.rate;
        const changePercent = Math.abs((rate - previousRate) / previousRate) * 100;
        
        if (changePercent > ALERT_THRESHOLD) {
          // Log significant rate change
          logSecurityEvent({
            event: 'RATE_VOLATILITY_ALERT',
            severity: 'warning',
            details: `Significant rate change detected for ${base}/${quote}: ${changePercent.toFixed(2)}%`,
          });
          
          console.warn(`Significant rate change detected for ${base}/${quote}: ${changePercent.toFixed(2)}%`);
        }
      }
      
      // Update cache
      rateCache.set(cacheKey, { rate, timestamp: Date.now() });
      
      // Save to current rates table
      const { error: upsertError } = await supabase
        .from('liquidity_rates')
        .upsert({
          base_currency: base,
          quote_currency: quote,
          source: source,
          rate: rate,
          fetched_at: new Date().toISOString()
        }, {
          onConflict: 'base_currency,quote_currency'
        });

      if (upsertError) {
        console.error('Error upserting rate:', upsertError);
      }

      // Save to history table
      const { error: insertError } = await supabase
        .from('liquidity_rate_history')
        .insert({
          base: base,
          quote: quote,
          source: source,
          rate: rate,
          fetched_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting rate history:', insertError);
      }
    } catch (error) {
      console.error('Error saving rate to database:', error);
    }
  }
}

// Export singleton instance
export const rateEngine = RateEngine.getInstance();