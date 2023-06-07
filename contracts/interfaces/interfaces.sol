// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Deposit Token Interface for BAL Reward Pool
 */
interface IDepositToken is IERC20 {
    function mint(address, uint256) external;
    function burn(address, uint256) external;
}

/**
 * @dev BAL Reward Pool
 */
interface IBALRewardPool {    
    function earned(address) external view returns (uint256);
    function stakeFor(address, uint256) external;
    function withdrawFor(address, uint256) external;
    function getReward(address) external;
    function getRewardRate() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function processIdleRewards() external;
    function queueNewRewards(uint256) external;    
}

/**
 * @dev Asset Data
 */
struct AssetData {
    uint128 emissionPerSecond;
    uint128 lastUpdateTimestamp; 
    uint256 index;
    mapping(address => uint256) users;
}

/**
 * @dev Auction Data
 */
struct AuctionData {
  uint128 startTime;
  uint128 endTime;
  uint256 totalOfferingTokens;
  uint256 totalBPTAmount; // balancer pool token amount
  uint256 minCommitmentsAmount;
  uint256 totalCommitments;
  bool instantClaimClosed;
  bool finalized;
}

interface IERC20Symbol is IERC20 {
  function symbol() external view returns (string memory s);
}

struct TokenInfo {
  address addr;
  uint256 amount;
  uint256 weight;
}

interface IAsset {
     // solhint-disable-previous-line no-empty-blocks
}

interface IBalancerPool is IERC20 {
    function getPoolId() external view returns (bytes32 poolId);
    function symbol() external view returns (string memory s);
}

interface IWeightedPoolFactory {
    function create(
        string memory name,
        string memory symbol,
        IAsset[] memory tokens,
        uint256[] memory weights,
        uint256 swapFeePercentage,
        address owner
    ) external returns (address);
}

interface IBalancerVault {
    enum JoinKind {INIT, EXACT_TOKENS_IN_FOR_BPT_OUT, TOKEN_IN_FOR_EXACT_BPT_OUT, ALL_TOKENS_IN_FOR_EXACT_BPT_OUT}

    struct JoinPoolRequest {
        IAsset[] assets;
        uint256[] maxAmountsIn;
        bytes userData;
        bool fromInternalBalance;
    }

    function joinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        JoinPoolRequest memory request
    ) external payable;
}

interface IStakingRewards {
  function stake(uint256 _amount) external;
}
