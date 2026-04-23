import { ethers } from "ethers";
import React, { createContext, useState, useEffect, useContext } from "react";
import IdentityABI from "../abis/IdentityVerifier.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [role, setRole] = useState<"ADMIN" | "VERIFIER" | "USER" | null>(null);
  const [signer, setSigner] = useState<any>(null);

  const IDENTITY_ADDR = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  const checkRoles = async (userAddr: string, currentSigner: any) => {
    try {
      const contract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, currentSigner);
      
      // OpenZeppelin's DEFAULT_ADMIN_ROLE is explicitly bytes32(0), NOT the keccak256 hash of a string!
      const ADMIN_ROLE = ethers.ZeroHash; 
      const VERIFIER_ROLE = ethers.id("VERIFIER_ROLE");

      const isAdmin = await contract.hasRole(ADMIN_ROLE, userAddr);
      const isVerifier = await contract.hasRole(VERIFIER_ROLE, userAddr);

      if (isAdmin) setRole("ADMIN");
      else if (isVerifier) setRole("VERIFIER");
      else setRole("USER");
    } catch (error) {
      console.error("Error checking roles (is the contract deployed to this network?):", error);
      setRole("USER"); // Default to USER on failure so app doesn't break
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed! Please install it to use this app.");
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const currentSigner = await provider.getSigner();
      
      setAccount(accounts[0]);
      setSigner(currentSigner);
      await checkRoles(accounts[0], currentSigner);
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet: " + (error.reason || error.message || "Unknown error"));
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accs: string[]) => {
        if (accs.length > 0) {
          setAccount(accs[0]);
          // Re-run role check on account switch
          window.ethereum.request({ method: 'eth_accounts' }).then(async () => {
             const provider = new ethers.BrowserProvider(window.ethereum);
             const s = await provider.getSigner();
             checkRoles(accs[0], s);
          });
        } else {
          setAccount(null);
          setRole(null);
        }
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{ account, role, connectWallet, signer }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);