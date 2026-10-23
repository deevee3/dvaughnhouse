// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {AIRDROP_CAMPAIGN_FEE} from "./PearlsConstants.sol";

/// @title AirdropDistributor
/// @notice One Merkle-root airdrop campaign. Trustless claims against a root
///         frozen at creation; the campaign token is funded by transfer
///         before claims open (the factory does this in the launch tx for
///         launch-time campaigns; post-launch campaigns are funded by their
///         creator directly).
///
/// @dev PROTOTYPE — unaudited, testnet only.
///
///      Fee mechanic (spec §6.4): creation costs a flat 0.0194 ETH, paid as
///      `msg.value` and forwarded IN FULL to the immutable treasury in the
///      constructor. The amount must be exact — overpayment reverts rather
///      than being absorbed. When the factory creates a campaign inside a
///      launch, it forwards exactly this fee from the launch call's value.
///
///      Pearls Plus+ Studio discounts are settled off-chain as rebates; this
///      contract is membership-blind by design (no subscription state in the
///      money path).
///
///      No admin keys: the root cannot change, claims cannot be paused, and
///      there is no sweep function. Unclaimed tokens stay in the contract —
///      a sweep would be a clawback power, and clawback powers are admin
///      keys. Campaign creators should size allocations accordingly.
contract AirdropDistributor {
    using SafeERC20 for IERC20;

    /// @notice Flat campaign fee: 0.0194 ETH (locked 2026-10-21).
    uint256 public constant CAMPAIGN_FEE = AIRDROP_CAMPAIGN_FEE;

    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;
    address public immutable treasury;

    /// @notice Claimed bitmap: word index => bits for 256 claim indices.
    mapping(uint256 => uint256) private _claimedBitmap;

    event Claimed(uint256 indexed index, address indexed account, uint256 amount);
    event FeePaid(address indexed treasury, uint256 amount);

    error ZeroAddress();
    error BadRoot();
    error WrongFee(uint256 sent, uint256 required);
    error AlreadyClaimed(uint256 index);
    error InvalidProof();

    constructor(IERC20 token_, bytes32 merkleRoot_, address treasury_) payable {
        if (address(token_) == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (merkleRoot_ == bytes32(0)) revert BadRoot();
        if (msg.value != CAMPAIGN_FEE) revert WrongFee(msg.value, CAMPAIGN_FEE);
        token = token_;
        merkleRoot = merkleRoot_;
        treasury = treasury_;
        Address.sendValue(payable(treasury_), msg.value);
        emit FeePaid(treasury_, msg.value);
    }

    /// @notice Whether a claim index has already been claimed.
    function isClaimed(uint256 index) public view returns (bool) {
        uint256 word = _claimedBitmap[index / 256];
        uint256 mask = 1 << (index % 256);
        return word & mask != 0;
    }

    function _setClaimed(uint256 index) private {
        _claimedBitmap[index / 256] |= (1 << (index % 256));
    }

    /// @notice Claim `amount` for `account` at leaf `index` with a Merkle
    ///         proof. Leaf encoding: keccak256(abi.encodePacked(index,
    ///         account, amount)) — the same encoding the off-chain snapshot
    ///         engine (spec §10) and any standard Merkle tooling produce.
    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata proof) external {
        if (isClaimed(index)) revert AlreadyClaimed(index);
        bytes32 leaf = keccak256(abi.encodePacked(index, account, amount));
        if (!MerkleProof.verifyCalldata(proof, merkleRoot, leaf)) revert InvalidProof();
        _setClaimed(index);
        token.safeTransfer(account, amount);
        emit Claimed(index, account, amount);
    }
}
