import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";
import AuctionABI from "../abis/KYCGatedAuction.json";

const IDENTITY_ADDR = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const AUCTION_ADDR = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";

const UserDashboard = () => {
  const { signer, account } = useWallet();
  const [docHash, setDocHash] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [auctionData, setAuctionData] = useState({
    highestBid: "0",
    highestBidder: "No bids yet",
    isVerified: false
  });

  const fetchData = async () => {
    try {
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);

      // Check identity verification status
      const isVerified = await identityContract.isVerified(account);

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
    try {
      setLoading(true);
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);

      const tx = await identityContract.registerIdentity(docHash);
      await tx.wait();
      
      alert("Identity registered successfully! A verifier will review your documents.");
      window.location.reload(); // Refresh to update verification status
    } catch (error: any) {
      console.error("Error registering identity:", error);
      alert("Registration failed. Ensure your document hash is valid and you have not registered before.");
    } finally {
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
      } else if (error.message.includes("Invalid bid amount")) {
        errorMessage = "Bid must be higher than the current highest bid.";
      } else if (error.message.includes("Auction ended")) {
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
          {auctionData.isVerified ? "Verified Identity" : "Identity Pending"}
        </span>
      </header>

      <div className="glass-card mb-8">
        <h3>1. Register Identity</h3>
        <p className="mb-4">Submit the cryptographic hash of your secure document to begin verification.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-field"
            placeholder="0x..." 
            onChange={(e) => setDocHash(e.target.value)} 
          />
          <button className="btn-primary" onClick={register} disabled={loading || auctionData.isVerified} style={{ whiteSpace: 'nowrap' }}>
            {loading ? "Registering..." : "Submit Hash"}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ border: '1px solid var(--accent-gold)' }}>
        <h3 style={{ color: 'var(--accent-gold)' }}>2. Exclusive Gated Auction</h3>
        <p className="mb-4">Participate in high-stakes auctions securely.</p>
        
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
          />
          <button 
            className="btn-primary"
            onClick={placeBid} 
            disabled={loading}
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