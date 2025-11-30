// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VinuGameEconomy {
    address public constant BURN_ADDRESS = 0x0000000000000000000000000000000000000000;
    address public constant TREASURY_ADDRESS = 0x0Bca22e20CAeb0b772402Ca2527a5228827D2DEE;

    uint256 public dailyPool;
    uint256 public weeklyPool;
    uint256 public monthlyPool;
    uint256 public yearlyPool;

    event ItemPurchased(address indexed user, string itemType, uint256 cost);

    function purchaseItem(string memory itemType) external payable {
        uint256 amount = msg.value;
        require(amount > 0, "Payment required");

        // Split Logic
        uint256 burnAmount = (amount * 25) / 100;
        uint256 treasuryAmount = (amount * 50) / 100;
        uint256 rewardPoolAmount = amount - burnAmount - treasuryAmount; // Remaining 25%

        // Transfers
        payable(BURN_ADDRESS).transfer(burnAmount);
        payable(TREASURY_ADDRESS).transfer(treasuryAmount);

        // Pool Allocation (of the remaining 25%)
        // 10% Daily, 30% Weekly, 40% Monthly, 20% Yearly
        dailyPool += (rewardPoolAmount * 10) / 100;
        weeklyPool += (rewardPoolAmount * 30) / 100;
        monthlyPool += (rewardPoolAmount * 40) / 100;
        yearlyPool += (rewardPoolAmount * 20) / 100;

        emit ItemPurchased(msg.sender, itemType, amount);
    }

    // Function to withdraw pools (restricted to admin/logic in future)
    // For now, we just keep track of the values.
}
