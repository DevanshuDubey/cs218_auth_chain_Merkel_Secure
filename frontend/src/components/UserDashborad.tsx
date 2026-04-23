import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";
import AuctionABI from "../abis/KYCGatedAuction.json";

const IDENTITY_ADDR = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const AUCTION_ADDR = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const BACKEND_URL = "http://localhost:5001";

const UserDashboard = () => {
  const { signer, account } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  
  const [auctionData, setAuctionData] = useState({
    highestBid: "0",
    highestBidder: "No bids yet",
    isVerified: false
  });

  const fetchData = async () => {
    try {
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);

      // Check blockchain identity verification status
      const isVerified = await identityContract.isVerified(account);

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

      // Fetch auction data only if verified
      let highestBid = "0";
      let highestBidder = "No bids yet";
      if (isVerified) {
        highestBid = (await auctionContract.highestBid()).toString();
        highestBidder = await auctionContract.highestBidder();
      }

      setAuctionData({
        isVerified,
        highestBid: highestBid,
        highestBidder
      });
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

      // 1. Read file to compute Hash for Blockchain and Base64 for Backend
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      // Ethers keccak256 expects a hex string for arbitrary data, so we convert the uint8 array to hex
      const docHash = ethers.keccak256(ethers.hexlify(uint8Array));

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const documentBase64 = reader.result;

        // 2. Send to Backend to store off-chain securely
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

        // 3. Register Identity on Blockchain using the computed Hash
        const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
        const tx = await identityContract.registerIdentity(docHash);
        await tx.wait();
        
        alert("Document uploaded to secure database and identity hash registered on blockchain successfully!");
        window.location.reload(); 
      };

    } catch (error: any) {
      console.error("Error registering identity:", error);
      alert("Registration failed. Ensure your document is valid and you have not registered before.");
      setLoading(false);
    }
  };

  const placeBid = async () => {
    try {
      setLoading(true);
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);

      const weiAmount = ethers.parseEther(bidAmount);
      const tx = await auctionContract.placeBid({ value: weiAmount });
      await tx.wait();
      
      alert("Bid placed successfully!");
      window.location.reload(); // Refresh to update bid status
    } catch (error: any) {
      console.error("Error placing bid:", error);
      
      let errorMessage = "Bid failed.";
      if (error.message && error.message.includes("Identity not verified")) {
        errorMessage = "Identity verification is required to bid.";
      } else if (error.message && error.message.includes("Invalid bid amount")) {
        errorMessage = "Bid must be higher than the current highest bid.";
      } else if (error.message && error.message.includes("Auction ended")) {
        errorMessage = "Auction has already ended.";
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="flex-between mb-8">
        <h2 style={{ margin: 0 }}>User Interface</h2>
        <span className={`badge ${auctionData.isVerified ? 'badge-verified' : 'badge-pending'}`}>
          {auctionData.isVerified ? "Verified Identity" : (dbStatus || "Not Registered")}
        </span>
      </header>

      {/* Conditionally Render Registration or Status */}
      {!dbStatus && !auctionData.isVerified ? (
          <div className="glass-card mb-8">
            <h3>1. Secure KYC Upload</h3>
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
          </div>
      ) : (
          <div className="glass-card mb-8" style={{ border: '1px solid var(--accent-gold)' }}>
             <h3 style={{ color: 'var(--accent-gold)' }}>KYC Status: {dbStatus || "Verified"}</h3>
             <p>Your document has been securely submitted. A verifier will review your request shortly. Your data is AES-256 encrypted off-chain.</p>
          </div>
      )}

      <div className="glass-card" style={{ border: '1px solid var(--accent-gold)', opacity: auctionData.isVerified ? 1 : 0.5 }}>
        <h3 style={{ color: 'var(--accent-gold)' }}>2. Exclusive Gated Auction</h3>
        <p className="mb-4">Participate in high-stakes auctions securely. (Requires Verified Identity)</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Highest Bid</p>
            <span style={{ fontSize: "1.75rem", color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>{auctionData.highestBid} ETH</span>
          </div>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Current Winner</p>
            <span style={{ fontSize: "0.9rem", color: 'var(--text-main)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{auctionData.highestBidder}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="number"
            className="input-field"
            placeholder="Amount in ETH" 
            onChange={(e) => setBidAmount(e.target.value)} 
            disabled={!auctionData.isVerified}
          />
          <button 
            className="btn-primary"
            onClick={placeBid} 
            disabled={loading || !auctionData.isVerified}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? "Bidding..." : "Place Bid"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;