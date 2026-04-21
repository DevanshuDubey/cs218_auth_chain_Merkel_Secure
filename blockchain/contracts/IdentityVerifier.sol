// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

// is AccessControl to inherit openzeppelin's security
contract identity_verifier is AccessControl {
    // track user's verification status
    enum Status {
        not_registered,
        pending,
        verified,
        revoked
    }

    //store for each user
    struct identity {
        bytes32 document_hash;
        Status status;
        address verified_by;
        uint256 timestamp; //when verified
    }

    mapping(address => identity) public users;

    //events which will be listened by frontend
    // indexed allowsn fronterd to search blockchain
    //(eg, all IdentityRegistered events but for my wallet address)
    event IdentityRegistered(address indexed user, bytes32 document_hash);
    event IdentityVerified(address indexed user, adress indexed verifier);
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
            identities[msg.sender].status == Status.not_registered ||
                identities[msg.sender].status == Status.revoked,
            "Identity already registered or pending"
        );

        // update the mapping for the person calling func
        identities[msg.sender] = Identity({
            document_hash: _document_hash,
            status: Status.pending,
            verified_by: address(0), // adress(0) -> nobody
            timestamp: 0
        });

        emit IdentityRegistered(msg.sender, _document_hash);
    }
}
