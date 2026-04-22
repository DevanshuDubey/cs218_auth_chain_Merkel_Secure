import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";

const IDENTITY_ADDR = "0x308A11442970E516aA3373f5254e985718363aB0";

const AdminDashboard = () => {
  const { signer } = useWallet();
  const [newVerifier, setNewVerifier] = useState("");

  const addVerifier = async () => {
    // contract logic
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0, color: 'var(--accent-gold)' }}>Administration Console</h2>
        <p>System configuration and access management.</p>
      </header>

      <div className="glass-card">
        <h3>Authorize New Verifier</h3>
        <p className="mb-4">Grant the VERIFIER_ROLE to a trusted address. They will gain the ability to approve user KYC requests.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-field"
            placeholder="Verifier Wallet Address (0x...)" 
            onChange={(e) => setNewVerifier(e.target.value)} 
          />
          <button 
            className="btn-primary" 
            onClick={addVerifier}
            style={{ whiteSpace: 'nowrap' }}
          >
            Grant Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;