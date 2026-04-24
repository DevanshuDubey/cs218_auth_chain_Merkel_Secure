# Decentralized Identity Verification (Merkel-Secure)

A comprehensive, zero-knowledge-compliant decentralized application (dApp) for Identity Verification (KYC). This project bridges the gap between Web3 transparency and Web2 privacy requirements by utilizing a hybrid architecture: securing cryptographic hashes on an Ethereum-compatible blockchain while storing sensitive documents in a fully encrypted, off-chain MongoDB database.

---

## 👥 Team Members

| Name                 | Roll Number |
|----------------------|-------------|
| Devanshu Dubey       | 240001024   |
| Abhinav Patel        | 240001004   |
| Abhay Lodhi          | 240001003   |
| Pratyush Gupta       | 240001054   |
| Abhishek Kumar Verma | 240001005   |
| Vivek Sahu           | 240005051   |

---

## 🚀 Key Features

*   **Zero-Knowledge Philosophy**: Sensitive user documents never touch the blockchain. Only cryptographic `keccak256` hashes are stored publicly.
*   **Encrypted Off-Chain Storage**: Documents are encrypted using `AES-256-CBC` symmetric encryption before being saved to MongoDB, ensuring GDPR and privacy compliance.
*   **Role-Based Access Control (RBAC)**: Smart contracts enforce strict roles (`DEFAULT_ADMIN_ROLE`, `VERIFIER_ROLE`). Only authorized agents can approve or revoke identities.
*   **Cryptographic Auditing**: Verifiers dynamically download decrypted documents, compute their hash locally, and match it against the immutable blockchain hash to mathematically prove document integrity.
*   **KYC-Gated Auction**: A composable `KYCGatedAuction` contract demonstrates how verified identities can gate access to DeFi functions.
*   **Clean UI/UX**: Built with React and Ethers.js, featuring a clean, literary "paperback" aesthetic.

---

## 🏗️ Architecture Overview

1.  **Frontend (`/frontend`)**: A React (Vite) application that handles user file uploads, MetaMask integration, and the Verifier/Admin dashboards.
2.  **Backend (`/backend`)**: An Express.js MVC server that handles MongoDB connections, AES encryption/decryption, and document retrieval.
3.  **Blockchain (`/blockchain`)**: Hardhat environment containing the Solidity smart contracts (`IdentityVerifier.sol`, `KYCGatedAuction.sol`).

---

## 🛠️ Prerequisites

*   **Node.js** (v18+ recommended)
*   **MongoDB** (Local instance via Compass, or MongoDB Atlas)
*   **MetaMask** (Browser Extension)
*   **Hardhat** (Installed locally via npm)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repo-url>
cd cs218_auth_chain_Merkel_Secure
```

### 2. Backend Setup (MongoDB & Encryption)
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.../kyc_database?appName=Cluster0
ENCRYPTION_KEY=12345678901234567890123456789012
PORT=5001
```

### 3. Blockchain Setup (Hardhat)
```bash
cd blockchain
npm install
```

**Compile contracts:**
```bash
npx hardhat compile
```

**Run tests with gas report:**
```bash
npx hardhat test
```

**Run coverage report:**
```bash
npx hardhat coverage
```

**Start local node & deploy:**
```bash
# Terminal 1 — start node
npx hardhat node

# Terminal 2 — deploy contracts
npx hardhat ignition deploy ignition/modules/Deploy.js --network localhost
```
*The deployer address (Account #0) automatically becomes the Admin.*

### 4. Frontend Setup
```bash
cd frontend
npm install
```
*Ensure the contract addresses in `WalletContext.tsx`, `UserDashboard.tsx`, `AdminDashboard.tsx`, and `VerifierDashboard.tsx` match the addresses generated during deployment.*

---

## 🏃‍♂️ Running the Application

You need three terminals running simultaneously:

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `cd blockchain && npx hardhat node` | Local Ethereum node |
| 2 | `cd backend && npm run start` | Express API server |
| 3 | `cd frontend && npm run dev` | React dev server |

---

## 📖 Usage Walkthrough

### Step 1: Admin Configuration
1. Import Hardhat Account #0 private key into MetaMask.
2. Connect MetaMask via the DApp → you will see the **Admin Dashboard**.
3. Paste the wallet address of your designated verifier (e.g., Account #19) and click **"Grant Role"**.

### Step 2: User Registration (KYC Upload)
1. Switch MetaMask to a user account (e.g., Account #1).
2. Connect to the DApp → you will see the **User Interface**.
3. Upload an identity document (PDF or image) and click **"Encrypt & Submit"**.
4. The frontend: (a) computes the `keccak256` hash of the file, (b) sends the raw file to the backend for AES-256 encryption, and (c) calls `registerIdentity(hash)` on-chain via MetaMask.
5. Status changes to **Pending**.

### Step 3: Verifier Approval
1. Switch MetaMask to the verifier account (Account #19).
2. Connect to the DApp → you will see the **Verifier Portal**.
3. Click on a pending address. The backend decrypts the stored document and displays it.
4. Click **"Verify Hash"** — the UI recomputes the hash from the decrypted document and compares it to the on-chain hash.
5. If hashes match, click **"Grant Verification"** → the on-chain status changes to **Verified**.

### Step 4: KYC-Gated Auction
1. Switch back to the user account.
2. Now the **Exclusive Gated Auction** section is enabled.
3. Enter a bid amount and click **"Place Bid"** → MetaMask prompts for the ETH transfer.
4. The contract checks `isVerified(msg.sender)` — only verified users can bid.

---

## 🔗 On-Chain vs Off-Chain Data

| Stored ON-CHAIN | Kept OFF-CHAIN |
|----------------|----------------|
| `keccak256` hash of identity document | The actual document (encrypted in MongoDB) |
| Verification status enum | Personal details (name, DOB, address) |
| Verifier address, timestamp | Document images, biometric data |
| Auction bids, highest bidder | User KYC for regulatory compliance |

> **GDPR Compliance**: GDPR Article 17 (Right to Erasure) is impossible to satisfy on a public blockchain. The hash-only pattern is the industry-standard solution — the hash proves the document existed and was verified, but reveals nothing about the document itself.

---

## ⚠️ Troubleshooting

- **MetaMask RPC Error -32603 (Nonce Desync)**: If you restart your Hardhat node, go to MetaMask → Settings → Advanced → Clear activity tab data to reset your account.
- **CORS Errors**: Ensure your backend `.env` is using `PORT=5001`. Port 5000 is reserved by macOS AirPlay Receiver.

---

## 📊 Gas Optimization

See [GAS_REPORT.md](./GAS_REPORT.md) for the detailed before/after analysis. Key result: **`verifyIdentity()` gas cost reduced by 41%** through struct packing.

---

## 🧪 Testing

- **32 tests**, all passing
- **100% line coverage**, 100% function coverage, 88% branch coverage

Run tests:
```bash
cd blockchain
npx hardhat test        # with gas report
npx hardhat coverage    # with coverage report
```
