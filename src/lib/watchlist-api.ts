export const watchlistAPI = {
  // Get all watchlists for a user
  async getWatchlists(walletAddress: string) {
    const response = await fetch(`/api/watchlist?walletAddress=${walletAddress}`);
    if (!response.ok) throw new Error('Failed to fetch watchlists');
    return response.json();
  },

  // Create a new watchlist
  async createWatchlist(data: {
    walletAddress: string;
    marketId: string;
    triggerType: string;
    triggerValue?: number;
    frequency?: string;
    isEmailNotification?: boolean;
    isTelegramNotification?: boolean;
  }) {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create watchlist');
    return response.json();
  },

  // Update an existing watchlist
  async updateWatchlist(id: string, data: {
    walletAddress: string;
    triggerType?: string;
    triggerValue?: number;
    frequency?: string;
    isEmailNotification?: boolean;
    isTelegramNotification?: boolean;
    isActive?: boolean;
  }) {
    const response = await fetch(`/api/watchlist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update watchlist');
    return response.json();
  },

  // Delete a watchlist
  async deleteWatchlist(id: string, walletAddress: string) {
    const response = await fetch(`/api/watchlist/${id}?walletAddress=${walletAddress}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete watchlist');
    return response.json();
  },

  // Create multiple watchlists at once
  async createBatchWatchlists(walletAddress: string, watchLists: Array<{
    marketId: string;
    triggerType: string;
    triggerValue?: number;
    frequency?: string;
    isEmailNotification?: boolean;
    isTelegramNotification?: boolean;
  }>) {
    const response = await fetch('/api/watchlist/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, watchLists })
    });
    if (!response.ok) throw new Error('Failed to create batch watchlists');
    return response.json();
  }
};