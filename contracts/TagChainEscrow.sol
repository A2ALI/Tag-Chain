// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TagChainEscrow is ReentrancyGuard {
    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        bool buyerConfirmed;
        bool sellerConfirmed;
        bool released;
        uint256 createdAt;
        uint256 releaseTime;
    }
    
    mapping(string => Escrow) public escrows;
    address public admin;
    
    event EscrowCreated(string orderId, address buyer, address seller, uint256 amount);
    event EscrowReleased(string orderId, address recipient, uint256 amount);
    event EscrowConfirmed(string orderId, address confirmer);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier escrowExists(string memory orderId) {
        require(escrows[orderId].buyer != address(0), "Escrow does not exist");
        _;
    }
    
    modifier escrowNotReleased(string memory orderId) {
        require(!escrows[orderId].released, "Escrow already released");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function createEscrow(string memory orderId, address seller) public payable {
        require(escrows[orderId].buyer == address(0), "Escrow already exists");
        require(msg.value > 0, "Amount must be greater than 0");
        
        escrows[orderId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            buyerConfirmed: false,
            sellerConfirmed: false,
            released: false,
            createdAt: block.timestamp,
            releaseTime: block.timestamp + 7 days
        });
        
        emit EscrowCreated(orderId, msg.sender, seller, msg.value);
    }
    
    function confirmReceipt(string memory orderId) public escrowExists(orderId) {
        Escrow storage escrow = escrows[orderId];
        require(msg.sender == escrow.buyer, "Only buyer can confirm");
        require(!escrow.buyerConfirmed, "Buyer already confirmed");
        
        escrow.buyerConfirmed = true;
        emit EscrowConfirmed(orderId, msg.sender);
        
        if (escrow.sellerConfirmed) {
            _releaseEscrow(orderId);
        }
    }
    
    function confirmDelivery(string memory orderId) public escrowExists(orderId) {
        Escrow storage escrow = escrows[orderId];
        require(msg.sender == escrow.seller, "Only seller can confirm");
        require(!escrow.sellerConfirmed, "Seller already confirmed");
        
        escrow.sellerConfirmed = true;
        emit EscrowConfirmed(orderId, msg.sender);
        
        if (escrow.buyerConfirmed) {
            _releaseEscrow(orderId);
        }
    }
    
    function releaseEscrow(string memory orderId) public escrowExists(orderId) escrowNotReleased(orderId) nonReentrant {
        Escrow storage escrow = escrows[orderId];
        require(block.timestamp >= escrow.releaseTime, "Release time not reached");
        
        _releaseEscrow(orderId);
    }
    
    function _releaseEscrow(string memory orderId) internal escrowExists(orderId) escrowNotReleased(orderId) {
        Escrow storage escrow = escrows[orderId];
        
        escrow.released = true;
        payable(escrow.seller).transfer(escrow.amount);
        
        emit EscrowReleased(orderId, escrow.seller, escrow.amount);
    }
    
    // Admin emergency functions
    function emergencyRefund(string memory orderId) public onlyAdmin escrowExists(orderId) escrowNotReleased(orderId) {
        Escrow storage escrow = escrows[orderId];
        escrow.released = true;
        payable(escrow.buyer).transfer(escrow.amount);
        
        emit EscrowReleased(orderId, escrow.buyer, escrow.amount);
    }
    
    function updateReleaseTime(string memory orderId, uint256 newReleaseTime) public onlyAdmin escrowExists(orderId) escrowNotReleased(orderId) {
        escrows[orderId].releaseTime = newReleaseTime;
    }
    
    // View functions
    function getEscrowDetails(string memory orderId) public view escrowExists(orderId) returns (
        address buyer,
        address seller,
        uint256 amount,
        bool buyerConfirmed,
        bool sellerConfirmed,
        bool released,
        uint256 createdAt,
        uint256 releaseTime
    ) {
        Escrow storage escrow = escrows[orderId];
        return (
            escrow.buyer,
            escrow.seller,
            escrow.amount,
            escrow.buyerConfirmed,
            escrow.sellerConfirmed,
            escrow.released,
            escrow.createdAt,
            escrow.releaseTime
        );
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}