import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";

const IDENTITY_ADDR = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const AdminDashboard = () => {
  const { signer } = useWallet();
  const [newVerifier, setNewVerifier] = useState("");
  const [verifierToRemove, setVerifierToRemove] = useState("");

  const addVerifier = async () => {
    try {
      const contract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await contract.addVerifier(newVerifier);
      await tx.wait();
      alert("New Verifier Added Successfully!");
      setNewVerifier("");
    } catch (err: any) {
      alert("Admin Error: " + (err.reason || err.message));
    }
  };

  const removeVerifier = async () => {
    try {
      const contract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await contract.removeVerifier(verifierToRemove);
      await tx.wait();
      alert("Verifier Removed Successfully!");
      setVerifierToRemove("");
    } catch (err: any) {
      alert("Admin Error: " + (err.reason || err.message));
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0, color: 'var(--accent-gold)' }}>Administration Console</h2>
        <p>System configuration and access management.</p>
      </header>

      <div className="glass-card mb-4">
        <h3>Authorize New Verifier</h3>
        <p className="mb-4">Grant the VERIFIER_ROLE to a trusted address. They will gain the ability to approve user KYC requests.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-field"
            placeholder="Verifier Wallet Address (0x...)" 
            value={newVerifier}
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

      <div className="glass-card">
        <h3>Revoke Verifier Role</h3>
        <p className="mb-4">Remove the VERIFIER_ROLE from an address. They will no longer be able to approve user KYC requests.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-field"
            placeholder="Verifier Wallet Address (0x...)" 
            value={verifierToRemove}
            onChange={(e) => setVerifierToRemove(e.target.value)} 
          />
          <button 
            className="btn-primary" 
            onClick={removeVerifier}
            style={{ whiteSpace: 'nowrap', backgroundColor: '#e74c3c' }}
          >
            Revoke Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;