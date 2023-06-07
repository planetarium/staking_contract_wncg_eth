
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TestSetup {
  using SafeERC20 for IERC20;

  address private constant hotbody = 0xa488533be3018a0720C4c0647F407F3b41e6Cb82;
  address private constant WETH_ADDRESS = 0xdFCeA9088c8A88A76FF74892C1457C17dfeef9C1;
  address private constant USDC = 0xe0C9275E44Ea80eF17579d33c55136b7DA269aEb;

  // TODO : approve hotbody, WETH, USDC from each ERC20 TOkens before send

  function send(address addr) public {
    IERC20(hotbody).safeTransferFrom(msg.sender, addr, 1000000000000000);
    IERC20(WETH_ADDRESS).safeTransferFrom(msg.sender, addr, 1000000000000000);
    IERC20(USDC).safeTransferFrom(msg.sender, addr, 100000);
  }
}
