// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title VestingVault
/// @notice Optional per-launch vesting for the creator/team allocation:
///         linear release with a cliff, every term frozen at construction.
///
/// @dev PROTOTYPE — unaudited, testnet only.
///
///      No admin keys: nobody can accelerate, revoke, redirect, or pause the
///      schedule — including the beneficiary and the factory. The vault is
///      funded once by the factory in the launch transaction (it must hold
///      the tokens before any release maths is meaningful; `totalAllocation`
///      is the immutable amount the schedule runs against, and the factory
///      transfers exactly that amount).
contract VestingVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable totalAllocation;
    uint256 public immutable startTime;
    uint256 public immutable cliffSeconds;
    uint256 public immutable durationSeconds;

    uint256 public released;

    event Released(address indexed beneficiary, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error BadSchedule();
    error NothingToRelease();

    constructor(
        IERC20 token_,
        address beneficiary_,
        uint256 totalAllocation_,
        uint256 startTime_,
        uint256 cliffSeconds_,
        uint256 durationSeconds_
    ) {
        if (address(token_) == address(0) || beneficiary_ == address(0)) revert ZeroAddress();
        if (totalAllocation_ == 0) revert ZeroAmount();
        if (durationSeconds_ == 0 || cliffSeconds_ > durationSeconds_) revert BadSchedule();
        token = token_;
        beneficiary = beneficiary_;
        totalAllocation = totalAllocation_;
        startTime = startTime_;
        cliffSeconds = cliffSeconds_;
        durationSeconds = durationSeconds_;
    }

    /// @notice Tokens vested (entitled) at the current time, released or not.
    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < startTime + cliffSeconds) return 0;
        if (block.timestamp >= startTime + durationSeconds) return totalAllocation;
        uint256 elapsed = block.timestamp - startTime;
        return (totalAllocation * elapsed) / durationSeconds;
    }

    /// @notice Tokens available to release right now.
    function releasable() public view returns (uint256) {
        return vestedAmount() - released;
    }

    /// @notice Release vested tokens to the beneficiary. Callable by anyone;
    ///         the destination is immutable, so a third-party call can only
    ///         ever pay the beneficiary.
    function release() external returns (uint256 amount) {
        amount = releasable();
        if (amount == 0) revert NothingToRelease();
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit Released(beneficiary, amount);
    }
}
