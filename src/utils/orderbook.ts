import { OrderBookResponse } from '@/types/index';

/**
 * Fetch order book data for one or multiple token IDs
 * @param tokenIds - Array of token IDs to fetch order books for
 * @returns Promise with order book data
 */
export async function fetchOrderBook(tokenIds: string[]): Promise<OrderBookResponse> {
  const response = await fetch('/api/market/order-book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token_ids: tokenIds,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order book');
  }

  return response.json();
}

/**
 * Fetch order book data for a single token ID
 * @param tokenId - Single token ID to fetch order book for
 * @returns Promise with single order book data
 */
export async function fetchSingleOrderBook(tokenId: string) {
  const data = await fetchOrderBook([tokenId]);
  return data.length > 0 ? data[0] : null;
}