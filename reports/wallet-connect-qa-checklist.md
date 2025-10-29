# Wallet Connect QA Checklist

This checklist ensures all wallet connect functionality works correctly across HashPack, Blade, and WalletConnect providers.

## Prerequisites
- [ ] Ensure `FEATURE_WALLET_CONNECT=true` in environment variables
- [ ] Verify all required packages are installed
- [ ] Confirm database migrations have been applied

## Manual Testing Steps

### 1. HashPack Wallet Connection
- [ ] Click "Connect HashPack" button
- [ ] Complete HashPack pairing flow
- [ ] Verify wallet address appears in UI
- [ ] Confirm `users.onchain_address` is updated in database
- [ ] Check that `users.wallet_type` is set to "hashpack"
- [ ] Verify security event logged in `security_events` table with event_type "wallet_connect"

### 2. Blade Wallet Connection
- [ ] Click "Connect Blade" button
- [ ] Complete Blade connection flow
- [ ] Verify wallet address appears in UI
- [ ] Confirm `users.onchain_address` is updated in database
- [ ] Check that `users.wallet_type` is set to "blade"
- [ ] Verify security event logged in `security_events` table with event_type "wallet_connect"

### 3. WalletConnect Fallback
- [ ] Click "Connect WalletConnect" button
- [ ] Complete WalletConnect connection flow
- [ ] Verify wallet address appears in UI
- [ ] Confirm `users.onchain_address` is updated in database
- [ ] Check that `users.wallet_type` is set to "walletconnect"
- [ ] Verify security event logged in `security_events` table with event_type "wallet_connect"

### 4. Wallet Disconnection
- [ ] Click "Disconnect Wallet" button
- [ ] Confirm wallet information is removed from UI
- [ ] Verify `users.onchain_address` is set to NULL in database
- [ ] Check that `users.wallet_type` is set to NULL
- [ ] Verify security event logged in `security_events` table with event_type "wallet_disconnect"

### 5. Security & Privacy Verification
- [ ] Confirm no private keys are logged in security_events
- [ ] Verify wallet addresses are properly masked in UI (e.g., 0.0.123...4567)
- [ ] Check that security events include proper user_id associations
- [ ] Confirm all security events have appropriate severity levels

### 6. Feature Flag Testing
- [ ] Set `FEATURE_WALLET_CONNECT=false`
- [ ] Verify wallet connect buttons are hidden
- [ ] Confirm wallet API endpoints return 501 Not Implemented
- [ ] Set `FEATURE_WALLET_CONNECT=true`
- [ ] Verify wallet connect functionality is restored

### 7. HashScan Integration
- [ ] Click HashScan link next to connected wallet address
- [ ] Confirm link opens correct HashScan page for wallet address
- [ ] Verify network (testnet/mainnet) is correct in URL

### 8. Error Handling
- [ ] Test with invalid wallet addresses
- [ ] Confirm proper error messages are displayed
- [ ] Verify failed connection attempts are logged appropriately
- [ ] Check rate limiting works (try connecting multiple times quickly)

## Automated Test Verification
- [ ] `npm run test:wallet` passes all tests
- [ ] All individual test scripts in `scripts/test-*.js` pass
- [ ] Security logger tests verify events are properly logged
- [ ] txTracer tests confirm URL generation works correctly

## Database Verification
- [ ] `users` table has `wallet_type` and `onchain_address` columns
- [ ] `security_events` table has required columns for wallet logging
- [ ] Indexes exist on `users.onchain_address` for performance
- [ ] Foreign key constraints are properly enforced

## Rollback Verification
- [ ] Confirm migration rollback instructions are available
- [ ] Verify git commits can be reverted cleanly
- [ ] Test that disabling feature flag effectively disables functionality

## Completion
- [ ] All checklist items completed
- [ ] Reports generated and saved to `reports/` directory
- [ ] No critical issues found
- [ ] Ready for production deployment