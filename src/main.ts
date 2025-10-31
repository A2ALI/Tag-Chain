import { connectionMonitor } from './lib/connectionMonitor';
import { handleError } from './utils/errorHandler';

async function initializeApp() {
  try {
    connectionMonitor.startMonitoring();
    // ...existing initialization code...
  } catch (error) {
    handleError(error);
  }
}

initializeApp();