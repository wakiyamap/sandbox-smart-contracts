//SPDX-License-Identifier: MIT

pragma solidity 0.8.2;

interface IContributionCalculator {
    function computeContribution(address account, uint256 amountStaked) external returns (uint256);
}
