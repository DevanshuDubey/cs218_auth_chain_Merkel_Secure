# Decentralized Identity Verification (Kredent)

A comprehensive, zero-knowledge-compliant decentralized application (dApp) for Identity Verification (KYC). This project bridges the gap between Web3 transparency and Web2 privacy requirements by utilizing a hybrid architecture: securing cryptographic hashes on an Ethereum-compatible blockchain while storing sensitive documents in a fully encrypted, off-chain MongoDB database.

## 🚀 Key Features

*   **Zero-Knowledge Philosophy**: Sensitive user documents never touch the blockchain. Only cryptographic `keccak256` hashes are stored publicly.
*   **Encrypted Off-Chain Storage**: Documents are encrypted using `AES-256-CBC` symmetric encryption before being saved to MongoDB, ensuring GDPR and privacy compliance.
*   **Role-Based Access Control (RBAC)**: Smart contracts enforce strict roles (`DEFAULT_ADMIN_ROLE`, `VERIFIER_ROLE`). Only authorized agents can approve or revoke identities.
*   **Cryptographic Auditing**: Verifiers dynamically download decrypted documents, compute their hash locally, and match it against the immutable blockchain hash to mathematically prove document integrity.
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

### 1. Backend Setup (MongoDB & Encryption)
Navigate to the backend directory and install dependencies:
````bash
cd backend
npm install
````

Create a `.env` file in the `backend` folder with the following configuration:
```env
# Your MongoDB Connection String (Atlas or Local)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.../kyc_database?appName=Cluster0

# A secure 32-character encryption key (Do not lose this, or documents will be permanently locked!)
ENCRYPTION_KEY=12345678901234567890123456789012

# Port
PORT=5001
```

### 2. Blockchain Setup (Hardhat)
Navigate to the blockchain directory and install dependencies:
```bash
cd blockchain
npm install
```

Start the local Hardhat node in one terminal:
```bash
npx hardhat node
```

In a *second* terminal, deploy the smart contracts to your local node:
```bash
npx hardhat ignition deploy ignition/modules/Deploy.js --network localhost
```
*Note: The deployer address (usually Account #0) automatically becomes the Admin.*

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```
*Ensure the contract addresses in `WalletContext.tsx`, `UserDashboard.tsx`, `AdminDashboard.tsx`, and `VerifierDashboard.tsx` match the addresses generated during the Hardhat deployment.*

---

## 🏃‍♂️ Running the Application

You will need three separate terminals running simultaneously to operate the full stack:

**Terminal 1: Blockchain Node**
```bash
cd blockchain
npx hardhat node
```

**Terminal 2: Backend Server**
```bash
cd backend
npm run start
# Or use: nodemon server.js
```

**Terminal 3: Frontend Server**
```bash
cd frontend
npm run dev
```

---

## 📖 Standard Operating Workflow

### 1. User Registration
1. User connects MetaMask (e.g., Account #1).
2. User uploads an identity document (Image/PDF) via the **User Dashboard**.
3. Frontend calculates the file's `keccak256` hash and sends the raw file to the backend.
4. Backend encrypts the file and saves it to MongoDB (`status: Pending`).
5. User confirms the MetaMask transaction to save the calculated hash to the blockchain.

### 2. Admin Configuration
1. Admin connects MetaMask (Account #0 - The deployer).
2. Admin navigates to the **Admin Dashboard**.
3. Admin inputs the wallet address of an agent (e.g., Account #1) and clicks "Grant Role" to authorize them as a Verifier.

### 3. Verification Process
1. Verifier connects MetaMask (Account #19).
2. Verifier navigates to the **Verifier Portal**, which fetches a list of pending requests from the database.
3. Verifier clicks a pending address. The backend decrypts the document and sends it to the UI for visual inspection.
4. Verifier clicks **"Verify Hash"**. The UI calculates the hash of the downloaded image and compares it to the hash stored on the blockchain.
5. If the hashes match, the Verifier clicks **"Grant Verification"**.
6. The smart contract updates to `Verified`, and the MongoDB database records the `verifiedBy` address and timestamp.

---

## ⚠️ Troubleshooting

- **MetaMask RPC Error -32603 (Nonce Desync)**: If you restart your Hardhat node, MetaMask will remember old transactions. Go to MetaMask -> Settings -> Advanced -> Clear activity tab data to reset your account.
- **CORS Errors**: Ensure your backend `.env` is using `PORT=5001`. Port 5000 is reserved by macOS AirPlay Receiver.
