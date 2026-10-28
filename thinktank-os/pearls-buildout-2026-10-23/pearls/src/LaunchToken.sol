// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title LaunchToken
/// @notice The token created by every Pearls launch. ERC-20 + Permit with a
///         fixed supply minted exactly once, at construction, to the factory
///         for same-transaction distribution.
///
/// @dev PROTOTYPE — unaudited, testnet only.
///
///      Deliberate absences (the product is what this contract CANNOT do):
///      no mint after construction, no burn function exposed to anyone, no
///      pause, no blacklist, no transfer tax, no owner, no setters, no proxy.
///      Metadata (name/symbol/decimals) is immutable by ERC20 construction.
///
///      Launch guard: an optional per-wallet holding cap enforced inside
///      `_update` for the first `walletCapBlocks` blocks after launch. The
///      cap compares the recipient's POST-transfer balance against
///      `walletCapAmount`. Exempt addresses (pool plumbing, locker, vault,
///      distributor) are fixed at construction — the cap exists to slow
///      snipers, not to break the launch's own distribution. After the
///      window, the check is permanently inert: one comparison against a
///      block number that can only move further into the past.
contract LaunchToken is ERC20, ERC20Permit {
    /// @notice The factory that deployed this token. Transfers FROM the
    ///         factory are the launch's initial distribution and are exempt
    ///         from the wallet cap (distribution is not sniping).
    address public immutable factory;
    /// @notice Block at which the token was deployed (the launch block).
    uint256 public immutable launchBlock;
    /// @notice Max balance per non-exempt wallet during the guard window.
    ///         0 disables the cap entirely.
    uint256 public immutable walletCapAmount;
    /// @notice Number of blocks the cap stays live after `launchBlock`.
    uint256 public immutable walletCapBlocks;

    /// @notice Addresses exempt from the wallet cap (pool, locker, vault,
    ///         distributor, factory, creator). Fixed at construction.
    mapping(address => bool) public capExempt;

    error WalletCapExceeded(address account, uint256 balanceAfter, uint256 cap);
    error ZeroAddress();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address factory_,
        uint256 walletCapAmount_,
        uint256 walletCapBlocks_,
        address[] memory capExempt_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        if (factory_ == address(0)) revert ZeroAddress();
        factory = factory_;
        launchBlock = block.number;
        walletCapAmount = walletCapAmount_;
        walletCapBlocks = walletCapBlocks_;
        for (uint256 i = 0; i < capExempt_.length; i++) {
            capExempt[capExempt_[i]] = true;
        }
        // The factory is always exempt: it holds the full supply briefly
        // during the launch transaction's distribution step.
        capExempt[factory] = true;
        capExempt[address(this)] = true;
        _mint(factory, totalSupply_);
    }

    /// @notice True while the wallet-cap guard window is open.
    function capActive() public view returns (bool) {
        return walletCapAmount != 0 && block.number <= launchBlock + walletCapBlocks;
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        // Cap check runs on the post-transfer balance. Mints (from == 0) only
        // occur in the constructor. Burns (to == 0) can only reduce a balance
        // and are exempt by construction of the check. Transfers from the
        // factory are the launch distribution itself, always exempt.
        if (to != address(0) && from != factory && capActive() && !capExempt[to]) {
            uint256 bal = balanceOf(to);
            if (bal > walletCapAmount) {
                revert WalletCapExceeded(to, bal, walletCapAmount);
            }
        }
    }
}
