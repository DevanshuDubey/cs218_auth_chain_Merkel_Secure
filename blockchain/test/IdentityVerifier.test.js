import { expect } from "chai";
import hre from "hardhat";

describe("IdentityVerifier & KYCGatedAuction", function () {
  let identityVerifier;
  let auction;
  let owner;
  let verifier;
  let user1;
  let user2;
  let user3;

  before(async function () {
    [owner, verifier, user1, user2, user3] = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const IdentityVerifierFactory = await hre.ethers.getContractFactory("IdentityVerifier");
    identityVerifier = await IdentityVerifierFactory.deploy();

    const AuctionFactory = await hre.ethers.getContractFactory("KYCGatedAuction");
    auction = await AuctionFactory.deploy(identityVerifier.target, owner.address);

    // Add verifier role
    await identityVerifier.addVerifier(verifier.address);
  });

  // ========================================================
  //  IDENTITY VERIFIER TESTS
  // ========================================================
  describe("IdentityVerifier — Happy Path", function () {
    it("Should register identity and set status to Pending", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await expect(identityVerifier.connect(user1).registerIdentity(docHash))
        .to.emit(identityVerifier, "IdentityRegistered")
        .withArgs(user1.address, docHash);

      const record = await identityVerifier.getIdentityRecord(user1.address);
      expect(record.status).to.equal(1); // Pending
    });

    it("Should verify a pending identity", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);

      expect(await identityVerifier.isVerified(user1.address)).to.be.true;
      const record = await identityVerifier.getIdentityRecord(user1.address);
      expect(record.status).to.equal(2); // Verified
      expect(record.verifiedBy).to.equal(verifier.address);
      expect(record.timestamp).to.be.greaterThan(0);
    });

    it("Should revoke a verified identity → status Revoked", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);
      expect(await identityVerifier.isVerified(user1.address)).to.be.true;

      await expect(identityVerifier.connect(verifier).revokeIdentity(user1.address))
        .to.emit(identityVerifier, "IdentityRevoked")
        .withArgs(user1.address, verifier.address);

      expect(await identityVerifier.isVerified(user1.address)).to.be.false;
      const record = await identityVerifier.getIdentityRecord(user1.address);
      expect(record.status).to.equal(3); // Revoked
    });

    it("Should allow re-registration after revocation", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);
      await identityVerifier.connect(verifier).revokeIdentity(user1.address);

      const newHash = hre.ethers.id("DOC_USER_1_V2");
      await expect(identityVerifier.connect(user1).registerIdentity(newHash))
        .to.emit(identityVerifier, "IdentityRegistered");
    });

    it("Should add and remove verifier via admin", async function () {
      await identityVerifier.addVerifier(user2.address);
      const VERIFIER_ROLE = hre.ethers.id("VERIFIER_ROLE");
      expect(await identityVerifier.hasRole(VERIFIER_ROLE, user2.address)).to.be.true;

      await identityVerifier.removeVerifier(user2.address);
      expect(await identityVerifier.hasRole(VERIFIER_ROLE, user2.address)).to.be.false;
    });

    it("An unregistered user is not verified", async function () {
      expect(await identityVerifier.isVerified(user2.address)).to.be.false;
    });
  });

  describe("IdentityVerifier — Access Control & Reverts", function () {
    it("Non-verifier cannot approve identities", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);

      await expect(
        identityVerifier.connect(user2).verifyIdentity(user1.address)
      ).to.be.revertedWithCustomError(identityVerifier, "AccessControlUnauthorizedAccount");
    });

    it("Non-verifier cannot revoke identities", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);

      await expect(
        identityVerifier.connect(user2).revokeIdentity(user1.address)
      ).to.be.revertedWithCustomError(identityVerifier, "AccessControlUnauthorizedAccount");
    });

    it("Non-admin cannot add verifier", async function () {
      await expect(
        identityVerifier.connect(user1).addVerifier(user2.address)
      ).to.be.revertedWithCustomError(identityVerifier, "AccessControlUnauthorizedAccount");
    });

    it("Non-admin cannot remove verifier", async function () {
      await expect(
        identityVerifier.connect(user1).removeVerifier(verifier.address)
      ).to.be.revertedWithCustomError(identityVerifier, "AccessControlUnauthorizedAccount");
    });

    it("Cannot register with empty hash", async function () {
      await expect(
        identityVerifier.connect(user1).registerIdentity(hre.ethers.ZeroHash)
      ).to.be.revertedWith("Hash cannot be empty");
    });

    it("Cannot register when already pending", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);

      await expect(
        identityVerifier.connect(user1).registerIdentity(docHash)
      ).to.be.revertedWith("Identity already registered or pending");
    });

    it("Cannot verify an unregistered user", async function () {
      await expect(
        identityVerifier.connect(verifier).verifyIdentity(user1.address)
      ).to.be.revertedWith("User is not in Pending status");
    });

    it("Cannot verify with zero address", async function () {
      await expect(
        identityVerifier.connect(verifier).verifyIdentity(hre.ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid user address");
    });

    it("Cannot revoke an unregistered user", async function () {
      await expect(
        identityVerifier.connect(verifier).revokeIdentity(user1.address)
      ).to.be.revertedWith("Can only revoke Verified or Pending users");
    });

    it("Cannot add zero-address as verifier", async function () {
      await expect(
        identityVerifier.addVerifier(hre.ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid verifier address");
    });

    it("Cannot remove zero-address verifier", async function () {
      await expect(
        identityVerifier.removeVerifier(hre.ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid verifier address");
    });

    it("Revoking a pending identity also works", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);

      await expect(identityVerifier.connect(verifier).revokeIdentity(user1.address))
        .to.emit(identityVerifier, "IdentityRevoked");

      const record = await identityVerifier.getIdentityRecord(user1.address);
      expect(record.status).to.equal(3); // Revoked
    });
  });

  // ========================================================
  //  KYC GATED AUCTION TESTS
  // ========================================================
  describe("KYCGatedAuction — Composability & Happy Path", function () {
    it("Unverified address bid reverts with 'KYC required'", async function () {
      await expect(
        auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("KYC required");
    });

    it("Verified address can place a bid successfully", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);

      await expect(
        auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") })
      ).to.emit(auction, "BidPlaced")
        .withArgs(user1.address, hre.ethers.parseEther("1.0"));

      expect(await auction.highestBidder()).to.equal(user1.address);
      expect(await auction.highestBid()).to.equal(hre.ethers.parseEther("1.0"));
    });

    it("Full auction flow: bid, outbid, withdraw refund, end, withdraw proceeds", async function () {
      // Verify user1 and user2
      const doc1 = hre.ethers.id("DOC_USER_1");
      const doc2 = hre.ethers.id("DOC_USER_2");
      await identityVerifier.connect(user1).registerIdentity(doc1);
      await identityVerifier.connect(user2).registerIdentity(doc2);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);
      await identityVerifier.connect(verifier).verifyIdentity(user2.address);

      // User1 bids 1 ETH
      await auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") });
      expect(await auction.highestBidder()).to.equal(user1.address);

      // User2 outbids with 2 ETH
      await auction.connect(user2).placeBid({ value: hre.ethers.parseEther("2.0") });
      expect(await auction.highestBidder()).to.equal(user2.address);

      // User1 should have 1 ETH in pendingReturns
      expect(await auction.pendingReturns(user1.address)).to.equal(hre.ethers.parseEther("1.0"));

      // User1 withdraws their refund
      const balBefore = await hre.ethers.provider.getBalance(user1.address);
      const tx = await auction.connect(user1).withdrawRefund();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await hre.ethers.provider.getBalance(user1.address);
      expect(balAfter - balBefore + gasCost).to.equal(hre.ethers.parseEther("1.0"));

      // Owner ends auction
      await expect(auction.connect(owner).endAuction())
        .to.emit(auction, "AuctionEnded")
        .withArgs(user2.address, hre.ethers.parseEther("2.0"));

      expect(await auction.ended()).to.be.true;

      // Owner withdraws proceeds
      const ownerBalBefore = await hre.ethers.provider.getBalance(owner.address);
      const tx2 = await auction.connect(owner).withdrawProceeds(owner.address);
      const receipt2 = await tx2.wait();
      const gasCost2 = receipt2.gasUsed * receipt2.gasPrice;
      const ownerBalAfter = await hre.ethers.provider.getBalance(owner.address);
      expect(ownerBalAfter - ownerBalBefore + gasCost2).to.equal(hre.ethers.parseEther("2.0"));
    });
  });

  describe("KYCGatedAuction — Reverts & Edge Cases", function () {
    // Helper: verify user1
    async function verifyUser1() {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);
    }
    async function verifyUser2() {
      const docHash = hre.ethers.id("DOC_USER_2");
      await identityVerifier.connect(user2).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user2.address);
    }

    it("Bid too low reverts", async function () {
      await verifyUser1();
      await verifyUser2();
      await auction.connect(user1).placeBid({ value: hre.ethers.parseEther("2.0") });

      await expect(
        auction.connect(user2).placeBid({ value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("Bid too low");
    });

    it("Bid of zero reverts (bid too low)", async function () {
      await verifyUser1();
      await expect(
        auction.connect(user1).placeBid({ value: 0 })
      ).to.be.revertedWith("Bid too low");
    });

    it("Bidding after auction ended reverts", async function () {
      await verifyUser1();
      await auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") });
      await auction.connect(owner).endAuction();

      await expect(
        auction.connect(user1).placeBid({ value: hre.ethers.parseEther("2.0") })
      ).to.be.revertedWith("Auction already ended");
    });

    it("Non-owner cannot end auction", async function () {
      await expect(
        auction.connect(user1).endAuction()
      ).to.be.revertedWithCustomError(auction, "OwnableUnauthorizedAccount");
    });

    it("Cannot end auction twice", async function () {
      await auction.connect(owner).endAuction();
      await expect(
        auction.connect(owner).endAuction()
      ).to.be.revertedWith("Already ended");
    });

    it("Cannot withdraw proceeds before auction ends", async function () {
      await expect(
        auction.connect(owner).withdrawProceeds(owner.address)
      ).to.be.revertedWith("Auction not ended");
    });

    it("Cannot withdraw proceeds to zero address", async function () {
      await auction.connect(owner).endAuction();
      await expect(
        auction.connect(owner).withdrawProceeds(hre.ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Cannot withdraw proceeds when no funds", async function () {
      await auction.connect(owner).endAuction();
      await expect(
        auction.connect(owner).withdrawProceeds(owner.address)
      ).to.be.revertedWith("No funds");
    });

    it("Cannot double-withdraw proceeds", async function () {
      await verifyUser1();
      await auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") });
      await auction.connect(owner).endAuction();
      await auction.connect(owner).withdrawProceeds(owner.address);

      await expect(
        auction.connect(owner).withdrawProceeds(owner.address)
      ).to.be.revertedWith("No funds");
    });

    it("Cannot withdraw refund with no pending balance", async function () {
      await expect(
        auction.connect(user1).withdrawRefund()
      ).to.be.revertedWith("No funds");
    });

    it("Non-owner cannot withdraw proceeds", async function () {
      await verifyUser1();
      await auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") });
      await auction.connect(owner).endAuction();

      await expect(
        auction.connect(user1).withdrawProceeds(user1.address)
      ).to.be.revertedWithCustomError(auction, "OwnableUnauthorizedAccount");
    });
  });
});
