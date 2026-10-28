// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AttestationRegistry
/// @notice The on-chain anchor for Glenride attestations issued by
///         ThinkTank OS ("Witness"). When ThinkTank OS issues an
///         attestation, the issuer anchors the attestation's subject hash
///         and public ID here, producing a public, timestamped proof that
///         the attestation existed at that block, in that form.
///
/// @dev PROTOTYPE — unaudited, testnet only (Base Sepolia / Anvil), like
///      every contract in this repo. A Pearls platform contract.
///
///      HASHES ONLY. This contract stores a SHA-256 subject hash, the
///      attestation's public ID (e.g. "GLR-AT-2026-XXXXXX"), the issuer
///      address, and the block timestamp. It never receives, stores, or
///      reveals manuscript content, evidence files, or personal data —
///      anchoring a hash proves existence and integrity without
///      publishing anything about the underlying work.
///
///      THINKTANK OS IS THE RECORD OF TRUTH. The full attestation —
///      claim, evidence list, compliance checks, verifier, challenges,
///      revocations — lives in ThinkTank OS. This registry is the public
///      timestamp proof that points at it: anyone can take a ThinkTank
///      OS attestation's subject hash and public ID and confirm here
///      that Glenride anchored exactly that hash, at exactly that time.
///      If the two ever disagree, ThinkTank OS is authoritative for the
///      attestation's content and this registry is authoritative only
///      for when (and by whom) its hash was anchored.
///
///      NO ADMIN SURFACE. There is exactly one privileged address — the
///      Glenride issuer (a Safe) — set once in the constructor and
///      immutable. There is no owner, no setter, no pause, no proxy, no
///      upgrade path, and no way to edit or delete an anchored record.
///      A record, once anchored, is permanent: attestation lifecycle
///      changes (challenge, revocation) happen in ThinkTank OS and are
///      never mirrored here, by design — the anchor proves the moment of
///      issuance, not the attestation's current status.
contract AttestationRegistry {
    /// @notice One anchored attestation: the subject hash that was
    ///         anchored, who anchored it, and when.
    struct AnchorRecord {
        bytes32 subjectHash;
        address issuer;
        uint256 anchoredAt;
    }

    /// @notice The Glenride issuer address (a Safe). The only caller that
    ///         can anchor. Immutable.
    address public immutable ISSUER;

    /// @dev Records keyed by keccak256(bytes(publicId)) — public IDs are
    ///      short human-readable strings; the mapping key is their hash.
    mapping(bytes32 => AnchorRecord) private _records;

    /// @dev Reverse lookup: subject hash → public ID. If two different
    ///      public IDs are ever anchored for the same subject hash, the
    ///      FIRST one anchored wins this lookup and later ones do not
    ///      overwrite it (each public ID still has its own forward
    ///      record via `recordOf`). Re-anchoring the same hash is legal
    ///      because ThinkTank OS can re-issue an attestation under a new
    ///      public ID (e.g. after a challenge is resolved); the reverse
    ///      lookup keeps pointing at the original anchoring.
    mapping(bytes32 => string) private _publicIdBySubjectHash;
    mapping(bytes32 => bool) private _subjectHashSeen;

    event Attested(string publicId, bytes32 indexed subjectHash, address indexed issuer, uint256 timestamp);

    error NotIssuer();
    error AlreadyAnchored();
    error ZeroAddress();

    constructor(address issuer_) {
        if (issuer_ == address(0)) revert ZeroAddress();
        ISSUER = issuer_;
    }

    /// @notice Anchor an attestation's subject hash under its public ID.
    ///         Issuer only. Each public ID can be anchored exactly once.
    /// @param subjectHash SHA-256 hash of the attested subject, computed
    ///        by ThinkTank OS. The hash is all that ever reaches the chain.
    /// @param publicId The attestation's public ID as issued by ThinkTank
    ///        OS (e.g. "GLR-AT-2026-XXXXXX").
    function anchor(bytes32 subjectHash, string calldata publicId) external {
        if (msg.sender != ISSUER) revert NotIssuer();
        bytes32 key = keccak256(bytes(publicId));
        if (_records[key].anchoredAt != 0) revert AlreadyAnchored();

        _records[key] = AnchorRecord({subjectHash: subjectHash, issuer: msg.sender, anchoredAt: block.timestamp});

        if (!_subjectHashSeen[subjectHash]) {
            _subjectHashSeen[subjectHash] = true;
            _publicIdBySubjectHash[subjectHash] = publicId;
        }

        emit Attested(publicId, subjectHash, msg.sender, block.timestamp);
    }

    /// @notice Read the anchor record for a public ID. `exists` is false
    ///         (and the other fields zero) when the ID was never anchored.
    function recordOf(string calldata publicId)
        external
        view
        returns (bytes32 subjectHash, address issuer, uint256 anchoredAt, bool exists)
    {
        AnchorRecord storage record = _records[keccak256(bytes(publicId))];
        exists = record.anchoredAt != 0;
        if (exists) {
            subjectHash = record.subjectHash;
            issuer = record.issuer;
            anchoredAt = record.anchoredAt;
        }
    }

    /// @notice Whether a public ID has been anchored.
    function isAnchored(string calldata publicId) external view returns (bool) {
        return _records[keccak256(bytes(publicId))].anchoredAt != 0;
    }

    /// @notice The public ID first anchored for a subject hash, or the
    ///         empty string if that hash was never anchored. See the
    ///         first-wins rule documented on `_publicIdBySubjectHash`.
    function publicIdOf(bytes32 subjectHash) external view returns (string memory) {
        return _publicIdBySubjectHash[subjectHash];
    }
}
