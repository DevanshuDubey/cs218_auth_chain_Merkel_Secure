import { expect } from "chai";
import hre from "hardhat";

describe("IdentityVerifier & KYCGatedAuction", function () {
  let identityVerifier;
  let auction;
  let owner;
  let verifier;
  let user1;
  let user2;

  before(async function () {
    [owner, verifier, user1, user2] = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const IdentityVerifierFactory = await hre.ethers.getContractFactory("IdentityVerifier");
    identityVerifier = await IdentityVerifierFactory.deploy();

    const AuctionFactory = await hre.ethers.getContractFactory("KYCGatedAuction");
    auction = await AuctionFactory.deploy(identityVerifier.target, owner.address);

    // Add verifier role
    await identityVerifier.addVerifier(verifier.address);
  });

  describe("IdentityVerifier Tests", function () {
    it("A non-verifier cannot approve identities", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      
      // user2 tries to verify user1 (should fail)
      await expect(
        identityVerifier.connect(user2).verifyIdentity(user1.address)
      ).to.be.revertedWithCustomError(identityVerifier, "AccessControlUnauthorizedAccount");
    });

    it("An unregistered user is not verified", async function () {
      const isVerified = await identityVerifier.isVerified(user2.address);
      expect(isVerified).to.be.false;
    });

    it("Revoking a verified identity correctly changes status to Revoked", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      
      // Verify
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);
      expect(await identityVerifier.isVerified(user1.address)).to.be.true;

      // Revoke
      await identityVerifier.connect(verifier).revokeIdentity(user1.address);
      expect(await identityVerifier.isVerified(user1.address)).to.be.false;

      const record = await identityVerifier.getIdentityRecord(user1.address);
      // Status enum: NotRegistered(0), Pending(1), Verified(2), Revoked(3)
      expect(record.status).to.equal(3);
    });
  });

  describe("KYCGatedAuction Composability", function () {
    it("Composability: deploy KYCGatedAuction, verify that an unverified address's bid reverts", async function () {
      await expect(
        auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") })
      ).to.be.revertedWith("KYC required");
    });

    it("After identity verification, the same address can bid successfully", async function () {
      const docHash = hre.ethers.id("DOC_USER_1");
      await identityVerifier.connect(user1).registerIdentity(docHash);
      await identityVerifier.connect(verifier).verifyIdentity(user1.address);

      await expect(
        auction.connect(user1).placeBid({ value: hre.ethers.parseEther("1.0") })
      ).to.emit(auction, "BidPlaced")
       .withArgs(user1.address, hre.ethers.parseEther("1.0"));

      expect(await auction.highestBidder()).to.equal(user1.address);
    });
  });
});
