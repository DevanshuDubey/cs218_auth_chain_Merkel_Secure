import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";
import AuctionABI from "../abis/KYCGatedAuction.json";

const IDENTITY_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AUCTION_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const AdminDashboard = () => {
  const { signer } = useWallet();
  const [newVerifier, setNewVerifier] = useState("");
  const [verifierToRemove, setVerifierToRemove] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);

  useEffect(() => {
    if (signer) {
      const fetchAuction = async () => {
        try {
          const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);
          const ended = await auctionContract.ended();
          setAuctionEnded(ended);
        } catch (e) { console.error(e) }
      };
      fetchAuction();
    }
  }, [signer]);

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

      {auctionEnded && (
        <div className="glass-card mb-8" style={{ border: '1px solid #e53e3e', backgroundColor: 'rgba(229, 62, 62, 0.1)' }}>
          <h3 style={{ color: '#e53e3e', margin: '0 0 0.5rem' }}>Auction Ended</h3>
          <p style={{ margin: 0 }}>The Kredent Live Auction has concluded. Check the Live Auction tab for details.</p>
        </div>
      )}

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