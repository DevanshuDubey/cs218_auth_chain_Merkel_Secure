// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

// @notice AccessControl is used to inherit openzeppelin's security
contract IdentityVerifier is AccessControl {
    /// @notice Role identifier for authorised verifiers
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // track user's verification status
    enum Status {
        NotRegistered,
        Pending,
        Verified,
        Revoked,
        Rejected
    }

    /**
     * @notice On-chain record for a single identity.
     * @dev Struct is tightly packed:
     *      Slot 0: document_hash  (bytes32 = 32 bytes → full slot)
     *      Slot 1: status (1 byte) + verified_by (20 bytes) + timestamp (8 bytes) = 29 bytes → single slot
     *      Total: 2 storage slots instead of 4.
     */
    struct Identity {
        bytes32 document_hash;
        Status status;            // uint8  —  1 byte
        address verified_by;      // 20 bytes , who verified
        uint64 timestamp;         // 8 bytes  , when verified
    }

    /// @notice Mapping from user address to their identity record
    mapping(address => Identity) public identities;

    //events which will be listened by frontend
    // indexed allowsn fronterd to search blockchain
    //(eg, all IdentityRegistered events but for my wallet address)
    event IdentityRegistered(address indexed user, bytes32 document_hash);
    event IdentityVerified(address indexed user, address indexed verifier);

    /// @notice Emitted when a verifier revokes an identity
    /// @param user    The address whose identity was revoked
    /// @param revoker The verifier who revoked
    event IdentityRevoked(address indexed user, address indexed revoker);
    event IdentityRejected(address indexed user, address indexed rejecter);

    /**
     * @notice Deploys the contract and grants DEFAULT_ADMIN_ROLE to the deployer.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Register a new identity by submitting the keccak256 hash of
     *         your off-chain document.
     * @param _document_hash keccak256 hash of the identity document
     */
    function registerIdentity(bytes32 _document_hash) external {
        require(_document_hash != 0, "Hash cannot be empty");

        //ensure user not already registered or pending
        require(
            identities[msg.sender].status == Status.NotRegistered ||
                identities[msg.sender].status == Status.Revoked,
            "Identity already registered or pending"
        );

        // update the mapping for the person calling func
        identities[msg.sender] = Identity({
            document_hash: _document_hash,
            status: Status.Pending,
            verified_by: address(0), // adress(0) -> nobody
            timestamp: 0
        });

        emit IdentityRegistered(msg.sender, _document_hash);
    }

    /**
     * @notice Approve a pending identity. Callable only by VERIFIER_ROLE holders.
     * @param _user Address of the user whose identity should be verified
     */
    function verifyIdentity(address _user) external onlyRole(VERIFIER_ROLE) {
        require(_user != address(0), "Invalid user address");
        require(
            identities[_user].status == Status.Pending,
            "User is not in Pending status"
        );
        identities[_user].status = Status.Verified;
        identities[_user].verified_by = msg.sender;
        identities[_user].timestamp = uint64(block.timestamp);
        emit IdentityVerified(_user, msg.sender);
    }

    /**
     * @notice Revoke a verified or pending identity. Callable only by VERIFIER_ROLE holders.
     * @param _user Address of the user whose identity should be revoked
     */
    function revokeIdentity(address _user) external onlyRole(VERIFIER_ROLE) {
        require(_user != address(0), "Invalid user address");
        require(
            identities[_user].status == Status.Verified ||
                identities[_user].status == Status.Pending,
            "Can only revoke Verified or Pending users"
        );
        identities[_user].status = Status.Revoked;
        emit IdentityRevoked(_user, msg.sender);
    }

    /**
     * @notice Reject a pending identity request. Callable only by VERIFIER_ROLE holders.
     * @param _user Address of the user whose identity should be rejected
     */
    function rejectIdentity(address _user) external onlyRole(VERIFIER_ROLE) {
        require(_user != address(0), "Invalid user address");
        require(
            identities[_user].status == Status.Pending,
            "Can only reject Pending users"
        );
        identities[_user].status = Status.Rejected;
        emit IdentityRejected(_user, msg.sender);
    }

    /**
     * @notice Check whether a given address has a Verified identity.
     * @param _user Address to check
     * @return True if the user's status is Verified
     */

    //view since we are only reading data so zero gas
    function isVerified(address _user) external view returns (bool) {
        return identities[_user].status == Status.Verified;
    }

    // =============== ADMIN FUNCTIONS ===============

    /**
     * @notice Grant the VERIFIER_ROLE to a new address. Only callable by DEFAULT_ADMIN_ROLE.
     * @param _verifier Address to be granted the verifier role
     */
    function addVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_verifier != address(0), "Invalid verifier address");
        grantRole(VERIFIER_ROLE, _verifier);
    }

    /**
     * @notice Remove the VERIFIER_ROLE from an address. Only callable by DEFAULT_ADMIN_ROLE.
     * @param _verifier Address to lose the verifier role
     */
    function removeVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_verifier != address(0), "Invalid verifier address");
        revokeRole(VERIFIER_ROLE, _verifier);
    }

    /**
     * @notice Retrieve the full identity record for a user.
     * @param _user Address to query
     * @return documentHash  keccak256 hash stored on-chain
     * @return status        Current verification status
     * @return verifiedBy    Address of the verifier (zero if not yet verified)
     * @return timestamp     Block timestamp of verification (0 if not yet verified)
     */
    function getIdentityRecord(address _user) external view returns (
        bytes32 documentHash,
        Status status,
        address verifiedBy,
        uint64 timestamp
    ) {
        Identity memory id = identities[_user];
        return (id.document_hash, id.status, id.verified_by, id.timestamp);
    }
}
