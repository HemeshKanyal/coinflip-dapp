// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Coinflip {
    address private owner;

    event CoinFlipped(address indexed player, bool result, uint256 amountWon);

    constructor() {
        owner = msg.sender;
    }

    // Flip function
    function flipcoin() public payable {
        require(msg.value > 0, "Please send some Ether!");
        uint256 betAmount = msg.value;
        uint256 winnings = 0;

        // Generate pseudo-random number
        uint256 randomNumber = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        ) % 2;

        bool playerWins = (randomNumber == 0);

        if (playerWins) {
            winnings = betAmount * 2;
            require(
                address(this).balance >= winnings,
                "Contract does not have enough funds"
            );
            payable(msg.sender).transfer(winnings);
        }

        emit CoinFlipped(msg.sender, playerWins, winnings);
    }

    // Allow contract to receive ETH
    receive() external payable {}

    // Helper to check balance
    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
