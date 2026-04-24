import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";

const IDENTITY_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const AdminDashboard = () => {
  const { signer } = useWallet();
  const [newVerifier, setNewVerifier] = useState("");
  const [verifierToRemove, setVerifierToRemove] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);

  const addVerifier = async () => {
    try {
      setLoadingAdd(true);
      const contract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await contract.addVerifier(newVerifier);
      await tx.wait();
      alert("New Verifier Added Successfully!");
      setNewVerifier("");
    } catch (err: any) {
      if (err.code === 'ACTION_REJECTED' || (err.message && err.message.toLowerCase().includes("user rejected"))) {
        alert("Transaction cancelled by user.");
      } else {
        alert("Admin Error: " + (err.reason || err.message));
      }
    } finally {
      setLoadingAdd(false);
    }
  };

  const removeVerifier = async () => {
    try {
      setLoadingRemove(true);
      const contract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await contract.removeVerifier(verifierToRemove);
      await tx.wait();
      alert("Verifier Removed Successfully!");
      setVerifierToRemove("");
    } catch (err: any) {
      if (err.code === 'ACTION_REJECTED' || (err.message && err.message.toLowerCase().includes("user rejected"))) {
        alert("Transaction cancelled by user.");
      } else {
        alert("Admin Error: " + (err.reason || err.message));
      }
    } finally {
      setLoadingRemove(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0, color: 'var(--accent-glow)' }}>Administration Console</h2>
        <p>System configuration and access management.</p>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3>Authorize New Verifier</h3>
        <p className="mb-4">Grant the VERIFIER_ROLE to a trusted address. They will gain the ability to approve user KYC requests.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              disabled={loadingAdd || !newVerifier}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loadingAdd ? "Processing..." : "Grant Role"}
            </button>
          </div>
          {loadingAdd && (
            <div className="processing-bar-container" style={{ width: '100%' }}>
              <div className="processing-bar"></div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <h3>Revoke Verifier Role</h3>
        <p className="mb-4">Remove the VERIFIER_ROLE from an address. They will no longer be able to approve user KYC requests.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              disabled={loadingRemove || !verifierToRemove}
              style={{ whiteSpace: 'nowrap', backgroundColor: loadingRemove || !verifierToRemove ? 'var(--bg-surface-hover)' : '#e74c3c' }}
            >
              {loadingRemove ? "Processing..." : "Revoke Role"}
            </button>
          </div>
          {loadingRemove && (
            <div className="processing-bar-container" style={{ width: '100%' }}>
              <div className="processing-bar"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;