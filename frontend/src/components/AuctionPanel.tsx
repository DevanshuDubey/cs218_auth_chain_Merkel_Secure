import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";
import AuctionABI from "../abis/KYCGatedAuction.json";

const IDENTITY_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AUCTION_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const AuctionPanel = () => {
  const { signer, account, role } = useWallet();
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [proceedsLoading, setProceedsLoading] = useState(false);
  const [withdrawRecipient, setWithdrawRecipient] = useState("");
  
  const [auctionData, setAuctionData] = useState({
    highestBid: "0",
    highestBidder: "No bids yet",
    ended: false,
    pendingReturn: "0",
  });

  const fetchData = async () => {
    try {
      if (!signer) return;
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);

      const highestBid = (await auctionContract.highestBid()).toString();
      const highestBidder = await auctionContract.highestBidder();
      const ended = await auctionContract.ended();
      let pendingReturn = "0";
      if (account) {
        pendingReturn = (await auctionContract.pendingReturns(account)).toString();
      }

      setAuctionData({
        highestBid: highestBid,
        highestBidder,
        ended,
        pendingReturn
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
      } else if (error.message && error.message.includes("Auction ended") || error.message.includes("Auction already ended")) {
        errorMessage = "Auction has already ended.";
      }
      alert(errorMessage);
      setLoading(false);
    }
  };

  const withdrawRefund = async () => {
    try {
      setWithdrawLoading(true);
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);
      const tx = await auctionContract.withdrawRefund();
      await tx.wait();
      alert("Refund withdrawn successfully!");
      fetchData();
    } catch (error: any) {
      console.error("Error withdrawing refund:", error);
      alert("Failed to withdraw refund: " + (error.reason || error.message));
    } finally {
      setWithdrawLoading(false);
    }
  };

  const endAuction = async () => {
    try {
      setLoading(true);
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);
      const tx = await auctionContract.endAuction();
      await tx.wait();
      alert("Auction ended successfully!");
      fetchData();
    } catch (error: any) {
      console.error("Error ending auction:", error);
      alert("Failed to end auction: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const withdrawProceeds = async () => {
    try {
      setProceedsLoading(true);
      const auctionContract = new ethers.Contract(AUCTION_ADDR, AuctionABI.abi, signer);
      
      // Validate address
      if (!ethers.isAddress(withdrawRecipient)) {
        alert("Please enter a valid Ethereum address.");
        setProceedsLoading(false);
        return;
      }

      const tx = await auctionContract.withdrawProceeds(withdrawRecipient);
      await tx.wait();
      alert("Proceeds withdrawn successfully!");
      setWithdrawRecipient("");
      fetchData();
    } catch (error: any) {
      console.error("Error withdrawing proceeds:", error);
      alert("Failed to withdraw proceeds: " + (error.reason || error.message));
    } finally {
      setProceedsLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0 }}>Kredent Live Auction</h2>
        <p>Participate in high-stakes auctions securely. Verified identities only.</p>
      </header>

      <div className="glass-card" style={{ border: '1px solid var(--accent-glow)' }}>
        <h3 style={{ color: 'var(--accent-glow)' }}>Exclusive Gated Auction {auctionData.ended && "(ENDED)"}</h3>
        
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

        {role === "ADMIN" ? (
           <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              {auctionData.ended ? (
                 <div>
                   <p style={{ color: '#e53e3e', fontWeight: 'bold', marginBottom: '1rem' }}>This auction has ended.</p>
                   {parseFloat(ethers.formatEther(auctionData.highestBid)) > 0 ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <p style={{ margin: 0, fontSize: '0.9rem' }}>Withdraw winning bid proceeds:</p>
                       <div style={{ display: 'flex', gap: '1rem' }}>
                         <input 
                           type="text"
                           className="input-field"
                           placeholder="Recipient Wallet Address (0x...)" 
                           value={withdrawRecipient}
                           onChange={(e) => setWithdrawRecipient(e.target.value)} 
                         />
                         <button 
                           className="btn-primary"
                           onClick={withdrawProceeds} 
                           disabled={proceedsLoading || !withdrawRecipient}
                           style={{ whiteSpace: 'nowrap' }}
                         >
                           {proceedsLoading ? "Processing..." : "Withdraw Proceeds"}
                         </button>
                       </div>
                     </div>
                   ) : (
                     <p style={{ color: 'var(--text-muted)' }}>No funds available to withdraw.</p>
                   )}
                 </div>
              ) : (
                 <button className="btn-primary" onClick={endAuction} disabled={loading}>
                   {loading ? "Ending..." : "End Auction"}
                 </button>
              )}
           </div>
        ) : (
           <div>
              {auctionData.ended ? (
                 <p style={{ color: '#e53e3e', fontWeight: 'bold', marginBottom: '1rem' }}>This auction has ended.</p>
              ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                   {bidAmount && parseFloat(bidAmount) <= parseFloat(ethers.formatEther(auctionData.highestBid)) && (
                     <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>
                       Bid amount must be higher than the current highest amount.
                     </p>
                   )}
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
              )}

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <h4 style={{ marginBottom: '1rem' }}>Your Refunds</h4>
                {parseFloat(ethers.formatEther(auctionData.pendingReturn)) > 0 ? (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>Available: {ethers.formatEther(auctionData.pendingReturn)} ETH</span>
                    <button className="btn-secondary" onClick={withdrawRefund} disabled={withdrawLoading}>
                      {withdrawLoading ? "Withdrawing..." : "Withdraw Refund"}
                    </button>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>You have no pending refunds to withdraw.</p>
                )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AuctionPanel;
