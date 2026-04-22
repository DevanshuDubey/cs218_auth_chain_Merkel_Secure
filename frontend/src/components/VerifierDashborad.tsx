import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";

const IDENTITY_ADDR = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

const VerifierDashboard = () => {
  const { signer } = useWallet();
  const [userToVerify, setUserToVerify] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyUser = async () => {
    if (!userToVerify) return alert("Please enter a wallet address.");
    try {
      setLoading(true);
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);

      const tx = await identityContract.verifyIdentity(userToVerify);
      await tx.wait();
      
      alert("User verified successfully!");
      setUserToVerify("");
    } catch (error: any) {
      console.error("Error verifying user:", error);
      alert("Verification failed. " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const revokeUser = async () => {
    if (!userToVerify) return alert("Please enter a wallet address.");
    try {
      setLoading(true);
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);

      const tx = await identityContract.revokeIdentity(userToVerify);
      await tx.wait();
      
      alert("User identity revoked successfully!");
      setUserToVerify("");
    } catch (error: any) {
      console.error("Error revoking user:", error);
      alert("Revocation failed. " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0, color: 'var(--accent-gold)' }}>Verifier Portal</h2>
        <p>Restricted access: Authorized Verification Agents Only.</p>
      </header>

      <div className="glass-card">
        <h3>Identity Management</h3>
        <p className="mb-4">Enter a user's wallet address to approve or revoke their KYC status.</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            className="input-field"
            placeholder="User Wallet Address (0x...)" 
            value={userToVerify}
            onChange={(e) => setUserToVerify(e.target.value)} 
            style={{ flex: '1 1 300px' }}
          />
          <button 
            className="btn-primary" 
            onClick={verifyUser} 
            disabled={loading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? "Processing..." : "Approve Identity"}
          </button>
          <button 
            className="btn-primary" 
            onClick={revokeUser} 
            disabled={loading}
            style={{ whiteSpace: 'nowrap', backgroundColor: '#e53e3e', color: 'white' }}
          >
            {loading ? "Processing..." : "Revoke Identity"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;