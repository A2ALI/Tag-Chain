import dotenv from 'dotenv';
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '****' : 'NOT SET');
console.log('LIQUIDITY_WALLET_ID:', process.env.LIQUIDITY_WALLET_ID);