import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";

const IDENTITY_ADDR = "YOUR_IDENTITY_CONTRACT_ADDRESS";

const VerifierDashboard = () => {
  const { signer } = useWallet();
  const [userToVerify, setUserToVerify] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyUser = async () => {
    // contract logic
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0, color: 'var(--accent-gold)' }}>Verifier Portal</h2>
        <p>Restricted access: Authorized Verification Agents Only.</p>
      </header>

      <div className="glass-card">
        <h3>Identity Verification</h3>
        <p className="mb-4">Enter the wallet address of the user you have physically or manually verified off-chain.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-field"
            placeholder="User Wallet Address (0x...)" 
            onChange={(e) => setUserToVerify(e.target.value)} 
          />
          <button 
            className="btn-primary" 
            onClick={verifyUser} 
            disabled={loading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? "Verifying..." : "Confirm Verification"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;