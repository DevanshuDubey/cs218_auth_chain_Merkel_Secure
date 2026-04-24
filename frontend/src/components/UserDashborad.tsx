import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";
import AuctionABI from "../abis/KYCGatedAuction.json";

const IDENTITY_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AUCTION_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const BACKEND_URL = "http://localhost:5001";

const UserDashboard = () => {
  const { signer, account } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);

  const fetchData = async () => {
    try {
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);

      // Check blockchain identity verification status
      const verified = await identityContract.isVerified(account);
      setIsVerified(verified);

      // Check Backend Database status
      try {
        const response = await fetch(`${BACKEND_URL}/api/documents/status/${account}`);
        if (response.ok) {
          const data = await response.json();
          if (data.registered) {
            setDbStatus(data.status); // 'Pending', 'Verified', or 'Revoked'
          }
        }
      } catch (err) {
        console.error("Backend not reachable or error fetching DB status", err);
      }

      try {
        const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);
        const ended = await auctionContract.ended();
        setAuctionEnded(ended);
      } catch (e) {
        console.error("Error fetching auction status:", e);
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (signer && account) fetchData();
  }, [signer, account]);

  const register = async () => {
    if (!file) {
      return alert("Please select a document to upload.");
    }

    try {
      setLoading(true);

      // 1. Read file and compute hash + base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const docHash = ethers.keccak256(ethers.hexlify(uint8Array));

      // Convert file to base64 using a promise (avoids callback error-swallowing)
      const documentBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      // 2. Register on blockchain FIRST (so cancelling MetaMask doesn't orphan DB data)
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await identityContract.registerIdentity(docHash);
      await tx.wait();

      // 3. Only AFTER blockchain confirms, upload to backend
      const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          documentBase64: documentBase64
        })
      });

      const backendData = await response.json();

      if (!response.ok) {
        setLoading(false);
        return alert(`Backend Error: ${backendData.error}`);
      }

      alert("Document uploaded to secure database and identity hash registered on blockchain successfully!");
      setLoading(false);
      setFile(null);
      fetchData();

    } catch (error: any) {
      console.error("Error registering identity:", error);

      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes("user rejected"))) {
        alert("Transaction cancelled by user. No data was saved.");
      } else {
        alert("Registration failed: " + (error.reason || error.message));
      }
      setLoading(false);
      fetchData();
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>User Interface</h2>
        <span className={`badge ${isVerified ? 'badge-verified' : 'badge-pending'}`}>
          {isVerified ? "Verified Identity" : (dbStatus || "Not Registered")}
        </span>
      </header>

      {auctionEnded && (
        <div className="glass-card mb-8" style={{ border: '1px solid #e53e3e', backgroundColor: 'rgba(229, 62, 62, 0.1)' }}>
          <h3 style={{ color: '#e53e3e', margin: '0 0 0.5rem' }}>Auction Ended</h3>
          <p style={{ margin: 0 }}>The Kredent Live Auction has concluded. Check the Live Auction tab for details.</p>
        </div>
      )}

      {!dbStatus && !isVerified ? (
        <div className="glass-card mb-20">
          <h3>Secure KYC Upload</h3>
          <p className="mb-4">Upload your identity document. The file will be encrypted and stored off-chain. Only its cryptographic hash will be stored permanently on the blockchain to guarantee privacy.</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="file"
              className="input-field"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              accept=".pdf,image/*"
              style={{ paddingTop: '10px' }}
            />
            <button className="btn-primary" onClick={register} disabled={loading || !file} style={{ whiteSpace: 'nowrap' }}>
              {loading ? "Processing..." : "Encrypt & Submit"}
            </button>
          </div>
          {loading && (
            <div className="processing-bar-container">
              <div className="processing-bar"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card mb-8" style={{ border: '1px solid var(--accent-glow)' }}>
          <h3 style={{ color: 'var(--accent-glow)' }}>KYC Status: {dbStatus || "Verified"}</h3>
          <p>Your document has been securely submitted. A verifier will review your request shortly. Your data is AES-256 encrypted off-chain.</p>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;