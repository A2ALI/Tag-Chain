# Tag Chain — DLT for Operations Track

> **Blockchain-Powered Livestock Traceability and Certification System for Africa**

[![Hedera](https://img.shields.io/badge/Hedera-Testnet-purple)](https://testnet.hedera.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 📋 Table of Contents

- [Pitch Deck & Certification](#-pitch-deck--certification)
- [Project Overview](#-project-overview)
- [Hedera Integration Summary](#-hedera-integration-summary)
- [Architecture](#-architecture)
- [Deployment & Setup](#-deployment--setup)
- [Deployed Hedera IDs](#-deployed-hedera-ids)
- [Security & Secrets](#-security--secrets)
- [Code Quality & Auditability](#-code-quality--auditability)
- [Technology Stack](#-technology-stack)
- [Features](#-features)
- [Acknowledgements](#-acknowledgements)

---

## 🎯 Pitch Deck & Certification

**Pitch Deck:** [View on Prezi](https://prezi.com/view/DBY96wfIL8UKdA9RxvkB/?referral_token=Z-aNwslnB3FN)

**Certification** https://drive.google.com/file/d/1IZrqaaF1c3eS-16QTZMNOWMpEiUh6nck/view?usp=drivesdk

**Track:** DLT for Operations

**Problem Statement:** Africa's livestock export industry faces critical challenges in traceability, certification authenticity, and compliance verification. Traditional paper-based systems are prone to fraud, lack transparency, and create barriers to international trade.

**Solution:** Tag Chain leverages Hedera's enterprise-grade DLT infrastructure to create an immutable, auditable, and cost-effective livestock traceability system that connects farmers, veterinarians, regulators, and buyers in a transparent ecosystem.

---

## 🌍 Project Overview

Tag Chain is a comprehensive blockchain-based livestock traceability and certification platform designed specifically for Africa's agricultural export ecosystem. The platform enables:

- **Farmers** to register livestock with immutable on-chain records
- **Veterinarians** to issue verifiable health certificates linked to blockchain proofs
- **Regulators** to audit and monitor compliance in real-time
- **Buyers** to verify livestock authenticity and health status via QR codes
- **Marketplace** participants to trade certified livestock with escrow protection

### Core Modules

1. **Animal Registration & Tracking** - Blockchain-backed livestock identity management
2. **Veterinary Certification** - Tamper-proof health certificates with HCS logging
3. **Marketplace & Escrow** - Secure peer-to-peer trading with smart contract protection
4. **Regulator Dashboard** - Read-only oversight with full audit trail access
5. **Early Warning System (EWS)** - Disease outbreak prediction and alerts
6. **Wallet Integration** - Non-custodial wallet support (HashPack, Blade)
7. **On/Off-Ramp** - Fiat-to-crypto conversion via Flutterwave integration

---

## 🔗 Hedera Integration Summary

Tag Chain leverages three core Hedera services to deliver enterprise-grade traceability and compliance:

### 1. Hedera Consensus Service (HCS)

**Purpose:** Immutable logging of livestock registration, certification events, and escrow state changes.

**Transaction Types Used:**
- `TopicCreateTransaction` - Creating dedicated topics for animals, certificates, users, and escrow events
- `TopicMessageSubmitTransaction` - Logging all critical state changes to the public ledger

**Implementation Details:**
- **Animal Registration Topic** (`VITE_HEDERA_TOPIC_ANIMALS`): Every animal registration is logged with metadata including tag number, breed, GPS coordinates, and farmer ID
- **Certificate Topic** (`VITE_HEDERA_TOPIC_CERTS`): Veterinary certificates are hashed and submitted to HCS for tamper-proof verification
- **Escrow Topic** (`VITE_HEDERA_TOPIC_ESCROW`): All escrow state transitions (create, fund, release, dispute) are logged for transparency
- **User Topic** (`VITE_HEDERA_TOPIC_USERS`): User wallet associations and on-chain identity creation

**Economic Justification:**
- **Predictable Costs**: HCS messages cost ~$0.0001 USD per submission, making it affordable for African farmers
- **ABFT Finality**: Asynchronous Byzantine Fault Tolerance ensures immediate finality without waiting for block confirmations
- **Scalability**: 10,000+ TPS capacity supports nationwide livestock registration without congestion
- **Auditability**: Regulators can verify all events via Mirror Nodes without blockchain node infrastructure

**Code Reference:**
```typescript
// netlify/functions/lib/hederaManager.ts
async submitTopicMessage(topicId: string, payload: any): Promise<{ txId: string }> {
  const message = JSON.stringify(payload);
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(client);
  return { txId: tx.transactionId.toString() };
}
```

---

### 2. Hedera Token Service (HTS)

**Purpose:** Digital representation of livestock ownership and stablecoin-based escrow payments.

**Transaction Types Used:**
- `TokenCreateTransaction` - Creating the TAGUSD stablecoin for marketplace transactions
- `TokenMintTransaction` - Minting tokens for on-ramp conversions (fiat → crypto)
- `TokenBurnTransaction` - Burning tokens for off-ramp conversions (crypto → fiat)
- `TokenAssociateTransaction` - Associating tokens with user wallets
- `TransferTransaction` - Transferring tokens between buyer, seller, and escrow accounts

**Implementation Details:**
- **TAGUSD Token** (`VITE_TAGUSD_TOKEN_ID`): A 1:1 USD-pegged stablecoin for marketplace transactions
- **Escrow Mechanism**: Tokens are held in a smart contract until both buyer and seller confirm delivery
- **Liquidity Pool**: Managed wallet for on/off-ramp operations with Flutterwave integration

**Economic Justification:**
- **Low Transaction Fees**: HTS transfers cost ~$0.001 USD, significantly cheaper than traditional payment processors (2-5%)
- **Instant Settlement**: No T+2 settlement delays common in traditional banking
- **Programmable Money**: Smart contract integration enables conditional releases and dispute resolution
- **Regulatory Compliance**: Transparent token flows enable AML/KYC compliance for export markets

**Code Reference:**
```typescript
// netlify/functions/api/tokens/mint.ts
const transaction = new TokenMintTransaction()
  .setTokenId(tokenId)
  .setAmount(amount)
  .execute(client);
```

---

### 3. Hedera Mirror Nodes

**Purpose:** Historical transaction verification and regulator audit access.

**Use Cases:**
- **Certificate Verification**: Buyers scan QR codes to verify certificate authenticity via Mirror Node queries
- **Audit Trails**: Regulators access complete transaction history without running full nodes
- **Dispute Resolution**: Escrow disputes are resolved by reviewing immutable HCS message sequences
- **Analytics**: Platform generates compliance reports by querying Mirror Node REST APIs

**Economic Justification:**
- **Zero Query Costs**: Mirror Node REST API access is free, eliminating infrastructure costs for regulators
- **Real-Time Data**: Sub-second latency for transaction lookups enables instant QR code verification
- **Decentralized Trust**: Multiple mirror node operators ensure data availability and censorship resistance

**Integration:**
```typescript
// src/utils/hashscanClient.ts
export async function verifyTransactionOnMirror(txId: string) {
  const response = await fetch(
    `https://testnet.mirrornode.hedera.com/api/v1/transactions/${txId}`
  );
  return response.json();
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Farmer  │  │   Vet    │  │  Buyer   │  │Regulator │       │
│  │Dashboard │  │Dashboard │  │Marketplace│  │Dashboard │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   React Frontend (Vite)    │
        │   - Components (TSX)       │
        │   - Hooks (useAuth, etc)   │
        │   - Supabase Client        │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  Netlify Functions (API)   │
        │  - Animal Registration     │
        │  - Certificate Issuance    │
        │  - Escrow Management       │
        │  - HCS Message Submission  │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   Supabase PostgreSQL      │
        │   - users, animals         │
        │   - certificates           │
        │   - transactions           │
        │   - ews_alerts             │
        └────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │    Hedera Testnet          │
        │  ┌──────────────────────┐  │
        │  │ HCS Topics           │  │
        │  │ - Animals: 7136376   │  │
        │  │ - Certs: 7136377     │  │
        │  │ - Escrow: 7119910    │  │
        │  └──────────────────────┘  │
        │  ┌──────────────────────┐  │
        │  │ HTS Token            │  │
        │  │ - TAGUSD: 7119909    │  │
        │  └──────────────────────┘  │
        │  ┌──────────────────────┐  │
        │  │ Mirror Nodes         │  │
        │  │ - REST API Access    │  │
        │  └──────────────────────┘  │
        └────────────────────────────┘
```

### Data Flow Example: Animal Registration

1. **Farmer** fills registration form in React dashboard
2. **Frontend** calls `/api/animals/register` Netlify Function
3. **Backend** inserts record into Supabase `animals` table
4. **Backend** submits HCS message to `VITE_HEDERA_TOPIC_ANIMALS`
5. **Hedera** returns transaction ID (e.g., `0.0.6919028@1730000000.123456789`)
6. **Backend** updates Supabase record with `hcs_tx_id`
7. **Frontend** displays success with HashScan link for verification

---

## 🚀 Deployment & Setup

### Prerequisites

- **Node.js** v18+ and npm
- **Supabase** account (free tier available)
- **Hedera Testnet** account with HBAR balance ([Portal](https://portal.hedera.com/))
- **Flutterwave** test account (optional, for payment testing)

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/tag-chain.git
cd tag-chain
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root. Use `.env.example` as a template:

```bash
cp .env.example .env
```

**Required Variables:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Hedera Configuration (Testnet)
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420YOUR_PRIVATE_KEY
VITE_HEDERA_NETWORK=testnet
VITE_HEDERA_TOPIC_ANIMALS=0.0.7136376
VITE_HEDERA_TOPIC_CERTS=0.0.7136377
VITE_HEDERA_TOPIC_ESCROW=0.0.7119910
VITE_TAGUSD_TOKEN_ID=0.0.7119909

# Feature Flags
FEATURE_ONCHAIN=true
FEATURE_WALLET_CONNECT=true
FEATURE_EWS=true
```

⚠️ **Security Note:** Never commit `.env` to version control. The `.gitignore` file excludes it by default.

### Step 4: Set Up Supabase Database

Run the migration scripts in order:

```bash
# Option 1: Via Supabase Dashboard SQL Editor
# Copy and paste contents of migrations/*.sql files

# Option 2: Via Supabase CLI (if installed)
supabase db push
```

**Required Tables:**
- `users` - User accounts with roles
- `farms` - Farm locations and ownership
- `animals` - Livestock records
- `certificates` - Veterinary certificates
- `transactions` - Escrow transactions
- `ews_alerts` - Early warning system alerts
- `ews_disease_rules` - Disease prediction rules

### Step 5: Run Frontend Development Server

```bash
npm run dev
```

Access the application at **http://localhost:5174**

### Step 6: Run Backend Functions (Netlify Dev)

For full functionality including Hedera integration:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Run dev server with functions
netlify dev
```

Access the full stack at **http://localhost:8888**

### Step 7: Test Hedera Connection

Verify your Hedera configuration:

```bash
npm run verify:blockchain
```

Expected output:
```
✅ Hedera client initialized
✅ Account balance: 100 HBAR
✅ Topic 0.0.7136376 accessible
✅ Token 0.0.7119909 exists
```

---

## 📍 Deployed Hedera IDs

All Hedera resources are deployed on **Testnet**:

| Resource | ID | Purpose | HashScan Link |
|----------|----|---------|--------------|
| **Operator Account** | `0.0.6919028` | Transaction signing account | [View](https://hashscan.io/testnet/account/0.0.6919028) |
| **Animals Topic** | `0.0.7136376` | Livestock registration logs | [View](https://hashscan.io/testnet/topic/0.0.7136376) |
| **Certificates Topic** | `0.0.7136377` | Veterinary certificate hashes | [View](https://hashscan.io/testnet/topic/0.0.7136377) |
| **Escrow Topic** | `0.0.7119910` | Escrow state transitions | [View](https://hashscan.io/testnet/topic/0.0.7119910) |
| **Users Topic** | `0.0.7136375` | User wallet associations | [View](https://hashscan.io/testnet/topic/0.0.7136375) |
| **TAGUSD Token** | `0.0.7119909` | Stablecoin for marketplace | [View](https://hashscan.io/testnet/token/0.0.7119909) |
| **Liquidity Wallet** | `0.0.7134789` | On/off-ramp liquidity pool | [View](https://hashscan.io/testnet/account/0.0.7134789) |

---

## 🔐 Security & Secrets

### Environment Variable Management

Tag Chain follows strict security practices for credential management:

✅ **Safe Practices:**
- `.env.example` provided for reference (no real credentials)
- `.env` excluded from Git via `.gitignore`
- Server-only secrets (e.g., `HEDERA_PRIVATE_KEY`) never exposed to frontend
- Client-safe variables prefixed with `VITE_` (e.g., `VITE_HEDERA_NETWORK`)

❌ **Never Commit:**
- Private keys (`HEDERA_PRIVATE_KEY`)
- Service role keys (`SUPABASE_SERVICE_ROLE_KEY`)
- API secrets (`FLW_SECRET_KEY`, `COINGECKO_API_KEY`)

### Credential Sharing for Judges

Test credentials will be provided securely via the **DoraHacks submission form**. Judges will receive:
- Hedera testnet account ID and private key
- Supabase project URL and service role key
- Flutterwave test API keys

**No private keys or production credentials are committed to this repository.**

---

## ✅ Code Quality & Auditability

### Linting & Formatting

- **ESLint** configured for TypeScript/React best practices
- **Prettier** (optional) for consistent code formatting
- Run linter: `npm run lint`

### Project Structure

```
tag-chain/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── FarmerDashboard.tsx
│   │   ├── VeterinarianDashboard.tsx
│   │   ├── MarketplacePage.tsx
│   │   └── ui/                   # Reusable UI components (ShadCN)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.tsx
│   │   └── useWallet.tsx
│   ├── lib/                      # Utility libraries
│   │   ├── hederaClient.ts       # HCS integration
│   │   ├── hederaTokenService.ts # HTS integration
│   │   └── supabaseClient.ts     # Database client
│   └── types/                    # TypeScript type definitions
├── netlify/functions/api/        # Backend serverless functions
│   ├── animals/register.ts       # Animal registration endpoint
│   ├── certificates/issue.ts     # Certificate issuance
│   ├── escrow/create.ts          # Escrow creation
│   └── hcs/submit-message.ts     # HCS message submission
├── scripts/                      # Utility scripts
│   ├── deploy-hedera-assets.ts   # Deploy topics/tokens
│   └── verify-blockchain.js      # Test Hedera connection
├── migrations/                   # Database migrations
└── contracts/                    # Solidity smart contracts
```

### Code Standards

- **Clear Naming**: Functions and variables use descriptive names (e.g., `submitHCSMessage`, `verifyAnimalCertificate`)
- **Inline Documentation**: Critical functions include JSDoc comments
- **Error Handling**: All API calls wrapped in try-catch with user-friendly error messages
- **Type Safety**: TypeScript strict mode enabled for production builds

---

## 🛠️ Technology Stack

### Frontend
- **React 18.2** with TypeScript
- **Vite 5.2** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first styling
- **ShadCN/UI** - Accessible component library (Radix UI primitives)
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization

### Backend
- **Netlify Functions** - Serverless API endpoints
- **Node.js 18+** - Runtime environment
- **Supabase** - PostgreSQL database with real-time subscriptions

### Blockchain
- **Hedera SDK 2.75** - HCS, HTS, and Smart Contract integration
- **HashConnect 1.24** - Wallet connection library

### Payments
- **Flutterwave** - Fiat on/off-ramp integration

### DevOps
- **Git** - Version control
- **ESLint** - Code linting
- **TypeScript 5.2** - Type safety

---

## 🎨 Features

### For Farmers
- ✅ Register livestock with blockchain-backed identity
- ✅ Upload photos and health records
- ✅ Generate QR codes for animal tags
- ✅ List animals on marketplace
- ✅ Receive escrow-protected payments

### For Veterinarians
- ✅ Issue tamper-proof health certificates
- ✅ Link certificates to animal on-chain profiles
- ✅ Verify vaccination records
- ✅ Access animal health history

### For Buyers
- ✅ Browse verified livestock marketplace
- ✅ Scan QR codes to verify authenticity
- ✅ Initiate escrow-protected purchases
- ✅ View certificate proofs on HashScan

### For Regulators
- ✅ Read-only dashboard with full audit access
- ✅ Monitor disease outbreaks via EWS
- ✅ Verify compliance via Mirror Node queries
- ✅ Generate export compliance reports

---

## 🙏 Acknowledgements

**Hedera Africa Hackathon 2025**

This project was built for the Hedera Africa Hackathon (DLT for Operations Track).

### Required Collaborator Access

As per hackathon requirements, the following email has been invited as a collaborator for AI judging system access:

📧 **Hackathon@hashgraph-association.com**

### Team

- **Developer**: [Your Name]
- **Track**: DLT for Operations
- **Submission Date**: October 31, 2025

### Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera Testnet Portal](https://portal.hedera.com/)
- [HashScan Explorer](https://hashscan.io/testnet)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Pitch Deck**: [Prezi Link](https://prezi.com/view/DBY96wfIL8UKdA9RxvkB/?referral_token=Z-aNwslnB3FN)
- **HashScan (Testnet)**: [View Transactions](https://hashscan.io/testnet)
- **GitHub Repository**: [tag-chain](https://github.com/YOUR_USERNAME/tag-chain)

---

**Built with ❤️ for Africa's Agricultural Future**

