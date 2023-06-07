// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
 * @dev Balancer Minter to retrieve BAL Reward from Balancer
 */
interface IBalancerMinter{
    function mint(address) external;
}
