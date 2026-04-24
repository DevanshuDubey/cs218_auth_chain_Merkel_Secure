import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";
import AuctionABI from "../abis/KYCGatedAuction.json";

const IDENTITY_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AUCTION_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const AuctionPanel = () => {
  const { signer, account } = useWallet();
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [auctionData, setAuctionData] = useState({
    highestBid: "0",
    highestBidder: "No bids yet",
  });

  const fetchData = async () => {
    try {
      if (!signer) return;
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);

      const highestBid = (await auctionContract.highestBid()).toString();
      const highestBidder = await auctionContract.highestBidder();

      setAuctionData({
        highestBid: highestBid,
        highestBidder
      });
    } catch (error: any) {
      console.error("Error fetching auction data:", error);
    }
  };

  useEffect(() => {
    if (signer && account) fetchData();
  }, [signer, account]);

  const placeBid = async () => {
    try {
      setLoading(true);
      
      // Explicitly check verification status via IdentityVerifier contract
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const isVerified = await identityContract.isVerified(account);
      
      if (!isVerified) {
        alert("Identity verification is required to be a part of auction.");
        setLoading(false);
        return;
      }

      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);
      const weiAmount = ethers.parseEther(bidAmount);
      const tx = await auctionContract.placeBid({ value: weiAmount });
      await tx.wait();
      
      alert("Bid placed successfully!");
      setLoading(false);
      setBidAmount("");
      fetchData(); // Refresh to update bid status
    } catch (error: any) {
      console.error("Error placing bid:", error);
      
      let errorMessage = "Bid failed.";
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes("user rejected"))) {
        errorMessage = "Transaction cancelled by user.";
      } else if (error.message && (error.message.includes("KYC required") || error.message.includes("Identity not verified"))) {
        errorMessage = "Identity verification is required to be a part of auction.";
      } else if (error.message && error.message.includes("Invalid bid amount")) {
        errorMessage = "Bid must be higher than the current highest bid.";
      } else if (error.message && error.message.includes("Auction ended")) {
        errorMessage = "Auction has already ended.";
      }
      alert(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0 }}>Kredent Live Auction</h2>
        <p>Participate in high-stakes auctions securely. Verified identities only.</p>
      </header>

      <div className="glass-card" style={{ border: '1px solid var(--accent-glow)' }}>
        <h3 style={{ color: 'var(--accent-glow)' }}>Exclusive Gated Auction</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Highest Bid</p>
            <span style={{ fontSize: "1.75rem", color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>{ethers.formatEther(auctionData.highestBid)} ETH</span>
          </div>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Current Winner</p>
            <span style={{ fontSize: "0.9rem", color: 'var(--text-main)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{auctionData.highestBidder}</span>
          </div>
        </div>

        {bidAmount && parseFloat(bidAmount) <= parseFloat(ethers.formatEther(auctionData.highestBid)) && (
          <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Bid amount must be higher than the current highest amount.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="number"
              className="input-field"
              placeholder="Amount in ETH" 
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)} 
            />
            <button 
              className="btn-primary"
              onClick={placeBid} 
              disabled={loading || !bidAmount || parseFloat(bidAmount) <= parseFloat(ethers.formatEther(auctionData.highestBid))}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? "Bidding..." : "Place Bid"}
            </button>
          </div>
          {loading && (
            <div className="processing-bar-container" style={{ width: '100%' }}>
              <div className="processing-bar"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionPanel;
