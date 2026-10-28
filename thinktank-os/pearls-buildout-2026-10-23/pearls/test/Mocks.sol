// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import {ILPPosition} from "../src/LaunchLocker.sol";

/// @notice Test-only quote asset (stands in for WETH/USDC).
contract MockQuoteAsset is ERC20 {
    constructor() ERC20("Mock Quote", "mQUOTE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @notice Test-only LP position: an ERC721 that also implements the
///         Pearls-side fee-collection interface (`ILPPosition`). Accrued
///         "fees" are modelled as balances of two fee tokens the mock is
///         pre-funded with; `collectFees` pays them out pro-rata to a
///         simple accrued counter the test can set.
contract MockLPPosition is ERC721, ILPPosition {
    ERC20 public immutable feeToken0;
    ERC20 public immutable feeToken1;
    uint256 public accrued0;
    uint256 public accrued1;
    uint256 private _nextId = 1;

    constructor(ERC20 feeToken0_, ERC20 feeToken1_) ERC721("Mock LP Position", "mLP") {
        feeToken0 = feeToken0_;
        feeToken1 = feeToken1_;
    }

    function mint(address to) external returns (uint256 id) {
        id = _nextId++;
        _safeMint(to, id);
    }

    function setAccrued(uint256 a0, uint256 a1) external {
        accrued0 = a0;
        accrued1 = a1;
    }

    function collectFees(address to) external returns (uint256 amount0, uint256 amount1) {
        amount0 = accrued0;
        amount1 = accrued1;
        accrued0 = 0;
        accrued1 = 0;
        if (amount0 > 0) feeToken0.transfer(to, amount0);
        if (amount1 > 0) feeToken1.transfer(to, amount1);
    }

    function token0() external view returns (address) {
        return address(feeToken0);
    }

    function token1() external view returns (address) {
        return address(feeToken1);
    }
}
