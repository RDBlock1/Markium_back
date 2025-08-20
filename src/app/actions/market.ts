'use server';

import { HoldersResponse, TokenHolders, HolderData } from "@/types/holder";
import { PriceReturns } from "@/types/market";
import { ClobClient } from "@polymarket/clob-client";

export async function getTopHolders(marketId: string): Promise<TokenHolders[] | []> {
  try {
    const response = await fetch(`https://data-api.polymarket.com/holders?market=${marketId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.error('Error fetching top holders:', response.statusText);
      return [];
    }

    const rawData: { token: string; holders: HolderData[] }[] = await response.json();

    console.log('Fetched top holders:', rawData);

    if (rawData.length < 2) return [];

    // Map API output into your TokenHolders format
    const mappedData: TokenHolders = {
      tokenYes: rawData[0].token,
      holdersYes: rawData[0].holders,
      tokenNo: rawData[1].token,
      holdersNo: rawData[1].holders
    };

    return [mappedData]; // because your function returns TokenHolders[]
  } catch (error) {
    console.error('Error fetching top holders:', error);
    return [];
  }
}

