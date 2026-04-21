// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KYCGatedAuction (Owner Controlled)
 * 
 * @notice Auction where only KYC-verified users can bid
 * @dev Owner has full control to end auction manually
 */

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @notice Interface for KYC verification contract
 */
interface IIdentityVerifier {
    function isVerified(address user) external view returns (bool);
}

contract KYCGatedAuction is Ownable, ReentrancyGuard {

    /// @notice KYC verifier contract (immutable for gas efficiency)
    IIdentityVerifier public immutable verifier;

    /// @notice Highest bidder and bid
    address public highestBidder;
    uint256 public highestBid;

    /// @notice Refund balances for outbid users
    mapping(address => uint256) public pendingReturns;

    /// @notice Auction state
    bool public ended;

    // ================= EVENTS =================

    event BidPlaced(address indexed bidder, uint256 amount);
    event RefundWithdrawn(address indexed bidder, uint256 amount);
    event AuctionEnded(address indexed winner, uint256 amount);
    event ProceedsWithdrawn(address indexed recipient, uint256 amount);

    // ================= MODIFIERS =================

    /**
     * @notice Only verified users can call
     */
    modifier onlyVerified() {
        require(verifier.isVerified(msg.sender), "KYC required");
        _;
    }

    /**
     * @notice Only allow actions when auction is active
     */
    modifier auctionActive() {
        require(!ended, "Auction already ended");
        _;
    }

    // ================= CONSTRUCTOR =================

    /**
     * @param _verifier Address of IdentityVerifier contract
     * @param _owner Owner of auction
     */
    constructor(address _verifier, address _owner) Ownable(_owner) {
        require(_verifier != address(0), "Invalid verifier");
        require(_owner != address(0), "Invalid owner");

        verifier = IIdentityVerifier(_verifier);
    }

    // ================= CORE FUNCTIONS =================

    /**
     * @notice Place a bid
     * @dev 
     * - Only KYC verified users
     * - Must send ETH greater than current highest bid
     */
    function placeBid() 
        external 
        payable 
        nonReentrant 
        onlyVerified 
        auctionActive 
    {
        require(msg.value > highestBid, "Bid too low");

        // Store refund for previous highest bidder
        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }

        // Update highest bid
        highestBidder = msg.sender;
        highestBid = msg.value;

        emit BidPlaced(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw refund if you were outbid
     */
    function withdrawRefund() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds");

        // Prevent reentrancy
        pendingReturns[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit RefundWithdrawn(msg.sender, amount);
    }

    /**
     * @notice End auction manually (ONLY OWNER)
     * @dev This gives control to owner (centralized)
     */
    function endAuction() external onlyOwner {
        require(!ended, "Already ended");

        ended = true;

        emit AuctionEnded(highestBidder, highestBid);
    }

    /**
     * @notice Withdraw winning bid amount
     * @param recipient Address receiving ETH
     */
    function withdrawProceeds(address payable recipient) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(ended, "Auction not ended");
        require(recipient != address(0), "Invalid recipient");

        uint256 amount = highestBid;
        require(amount > 0, "No funds");

        // Prevent double withdrawal
        highestBid = 0;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit ProceedsWithdrawn(recipient, amount);
    }
}