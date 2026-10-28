// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title LaunchCertificate
/// @notice "The pearl" — one ERC-721 per Pearls launch, holding the full
///         plain-language launch record on-chain. The frontend renders the
///         certificate from this record and the launch events; nothing about
///         a launch exists only off-chain.
///
/// @dev PROTOTYPE — unaudited, testnet only.
///
///      The factory address is set once in the constructor and is immutable;
///      it is the only caller that can mint. Records are written exactly once
///      at mint time and there is no update function. The NFT is a receipt /
///      collectible: holding it confers NO rights over the launch (LP fee
///      claim rights live in the LaunchLocker, keyed to the creator address
///      recorded here). That separation is deliberate and documented in the
///      spec (§5).
contract LaunchCertificate is ERC721 {
    enum LockMode {
        Abyssal, // forever
        Timed // >= 180 days, unlock timestamp in the record
    }
    enum LpFeeMode {
        CreatorClaimable,
        DeadCompounded
    }

    /// @notice The complete launch record. Mirrors LaunchParams plus the
    ///         deployed module addresses, so a single read reconstructs the
    ///         whole certificate.
    struct CertificateRecord {
        address token;
        address creator;
        address quoteAsset;
        uint256 totalSupply;
        uint24 poolFeeTier;
        uint256 volumeThresholdQuote; // $10M gate, fixed quote units (§6.2)
        uint256 usdGate; // display anchor, 6-dec USD (10_000_000e6 at concept)
        LockMode lockMode;
        uint256 unlockTime; // 0 for Abyssal ("forever")
        LpFeeMode lpFeeMode;
        uint16 vestingBps;
        uint16 airdropBps;
        uint16 liquidityBps;
        address locker;
        address vestingVault; // address(0) if unused
        address airdropDistributor; // address(0) if unused
        address hookCore;
        uint256 launchBlock;
        uint256 chainId;
    }

    /// @notice The only address that can mint certificates. Immutable.
    address public immutable factory;

    uint256 private _nextId = 1;
    mapping(uint256 => CertificateRecord) private _records;

    event CertificateMinted(uint256 indexed launchId, address indexed token, address indexed creator);

    error NotFactory();
    error ZeroAddress();

    constructor(address factory_) ERC721("Pearls Launch Certificate", "PEARL") {
        if (factory_ == address(0)) revert ZeroAddress();
        factory = factory_;
        // Deployed BY the factory inside the factory's own constructor, so
        // the factory address is known exactly (address(this) of the
        // deployer) — no predicted-address tricks, no post-deploy wiring,
        // nothing left settable.
    }

    /// @notice Sequential id the next launch will receive.
    function nextLaunchId() external view returns (uint256) {
        return _nextId;
    }

    /// @notice Mint a certificate and freeze its record. Factory only.
    /// @dev The record's `locker`, `vestingVault`, `airdropDistributor` and
    ///      `hookCore` fields must already point at the deployed modules;
    ///      the factory composes them before calling.
    function mint(address to, CertificateRecord calldata record) external returns (uint256 launchId) {
        if (msg.sender != factory) revert NotFactory();
        if (to == address(0)) revert ZeroAddress();
        launchId = _nextId++;
        _records[launchId] = record;
        _safeMint(to, launchId);
        emit CertificateMinted(launchId, record.token, record.creator);
    }

    /// @notice Read a launch's frozen record.
    function recordOf(uint256 launchId) external view returns (CertificateRecord memory) {
        return _records[launchId];
    }
}
