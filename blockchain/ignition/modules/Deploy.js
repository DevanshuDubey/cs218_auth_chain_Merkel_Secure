import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployModule", (m) => {
  const deployer = m.getAccount(0);

  // 1. Deploy the IdentityVerifier contract
  const identityVerifier = m.contract("IdentityVerifier");

  // 2. Deploy the KYCGatedAuction contract, passing the IdentityVerifier's address
  // Note: Your KYCGatedAuction constructor must accept the IdentityVerifier address.
  const auction = m.contract("KYCGatedAuction", [identityVerifier, deployer]);

  return { identityVerifier, auction };
});
