#!/usr/bin/env python3
"""
tools/generate_token_list.py

Generates a Uniswap Token List schema JSON (version 1.0.0) from Pearls `Launched` event logs.
Enables instant off-chain discovery and Uniswap interface routing for Pearls pools.
"""

import json
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any


def format_token_entry(event: Dict[str, Any], default_chain_id: int = 84532) -> Dict[str, Any]:
    """Formats a single Pearls Launched event into a Uniswap Token List token entry."""
    chain_id = event.get("chainId", default_chain_id)
    token_address = event["token"]
    name = event.get("name", f"Pearls Token #{event.get('certificateId', '')}")
    symbol = event.get("symbol", f"PRL{event.get('certificateId', '')}")
    decimals = int(event.get("decimals", 18))

    entry = {
        "chainId": chain_id,
        "address": token_address,
        "name": name,
        "symbol": symbol,
        "decimals": decimals,
        "extensions": {
            "certificateId": int(event["certificateId"]),
            "poolId": event["poolId"],
            "poolFeeTier": int(event["poolFeeTier"]),
            "tickSpacing": int(event["tickSpacing"]),
            "hook": event["hook"],
            "hookCore": event.get("hookCore", ""),
            "quoteAsset": event["quoteAsset"],
            "creator": event.get("creator", ""),
            "locker": event.get("locker", ""),
            "volumeThresholdQuote": str(event.get("volumeThresholdQuote", "")),
        }
    }
    if "logoURI" in event:
        entry["logoURI"] = event["logoURI"]
    return entry


def generate_token_list(
    events: List[Dict[str, Any]],
    list_name: str = "Pearls Launches",
    default_chain_id: int = 84532,
    timestamp: str = None
) -> Dict[str, Any]:
    """Builds a complete Uniswap token list dictionary from a list of Launched events."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()

    tokens = [format_token_entry(e, default_chain_id) for e in events]

    return {
        "name": list_name,
        "timestamp": timestamp,
        "version": {
            "major": 1,
            "minor": 0,
            "patch": 0
        },
        "tags": {
            "pearls": {
                "name": "Pearls Launchpad",
                "description": "Tokens launched via Pearls immutable Uniswap v4 launchpad"
            }
        },
        "logoURI": "https://thinktank.technology/pearls/logo.png",
        "keywords": ["pearls", "thinktank", "uniswap-v4", "base"],
        "tokens": tokens
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate Uniswap Token List from Pearls Launched events.")
    parser.add_argument("--input", "-i", type=str, default="", help="Path to JSON file with Launched events (or stdin)")
    parser.add_argument("--output", "-o", type=str, default="", help="Path to write token list JSON (or stdout)")
    parser.add_argument("--chain-id", type=int, default=84532, help="Default chain ID (default: 84532 Base Sepolia)")
    parser.add_argument("--name", type=str, default="Pearls Launches", help="Token list name")
    args = parser.parse_args()

    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            events = json.load(f)
    else:
        events = json.load(sys.stdin)

    if isinstance(events, dict) and "events" in events:
        events = events["events"]

    token_list = generate_token_list(events, list_name=args.name, default_chain_id=args.chain_id)

    output_str = json.dumps(token_list, indent=2)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_str + "\n")
    else:
        print(output_str)


if __name__ == "__main__":
    main()
