// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

// is AccessControl to inherit openzeppelin's security
contract IdentityVerifier is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // track user's verification status
    enum Status {
        NotRegistered,
        Pending,
        Verified,
        Revoked
    }

    //store for each user
    struct Identity {
        bytes32 document_hash;
        Status status;
        address verified_by;
        uint256 timestamp; //when verified
    }

    mapping(address => Identity) public identities;

    //events which will be listened by frontend
    // indexed allowsn fronterd to search blockchain
    //(eg, all IdentityRegistered events but for my wallet address)
    event IdentityRegistered(address indexed user, bytes32 document_hash);
    event IdentityVerified(address indexed user, address indexed verifier);
    event IdentityRevoked(address indexed user, address indexed revoker);

    constructor() {
        //DEFAULT_ADMIN_ROLE from openzepp
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    //we get hash of document from frontend
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

    function verifyIdentity(address _user) external onlyRole(VERIFIER_ROLE) {
        require(_user != address(0), "Invalid user address");
        require(
            identities[_user].status == Status.Pending,
            "User is not in Pending status"
        );
        identities[_user].status = Status.Verified;
        identities[_user].verified_by = msg.sender;
        identities[_user].timestamp = block.timestamp;
        emit IdentityVerified(_user, msg.sender);
    }

    function revokeIdentity(address _user) external onlyRole(VERIFIER_ROLE) {
        require(_user != address(0), "Invalid user address");
        require(
            identities[_user].status == Status.Verified,
            "Can only revoke Verified users"
        );
        identities[_user].status = Status.Revoked;
        emit IdentityRevoked(_user, msg.sender);
    }

    //view since we are only reading data so zero gas
    function isVerified(address _user) external view returns (bool) {
        return identities[_user].status == Status.Verified;
    }

    function addVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_verifier != address(0), "Invalid verifier address");
        grantRole(VERIFIER_ROLE, _verifier);
    }

    function removeVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_verifier != address(0), "Invalid verifier address");
        revokeRole(VERIFIER_ROLE, _verifier);
    }

    function getIdentityRecord(address _user) external view returns (
        bytes32 documentHash,
        Status status,
        address verifiedBy,
        uint256 timestamp
    ) {
        Identity memory id = identities[_user];
        return (id.document_hash, id.status, id.verified_by, id.timestamp);
    }
}
