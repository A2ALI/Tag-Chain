// Test file to verify that our Hedera modules can be imported correctly
import { createToken, mintToken, burnToken, transferToken } from "./hederaTokenService";
import { deployEscrowContract, sendEscrowPayment, releaseEscrowPayment, getEscrowDetails } from "./hederaEscrowContract";
import { createConsensusTopic, logCertificateHash, getConsensusMessages } from "./hederaConsensus";

console.log("Hedera modules imported successfully");

// Export for use in other modules
export {
  createToken,
  mintToken,
  burnToken,
  transferToken,
  deployEscrowContract,
  sendEscrowPayment,
  releaseEscrowPayment,
  getEscrowDetails,
  createConsensusTopic,
  logCertificateHash,
  getConsensusMessages
};