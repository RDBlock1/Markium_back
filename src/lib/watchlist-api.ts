export const watchlistAPI = {
  // Get all watchlists for a user
  async getWatchlists(email: string) {
    const response = await fetch(`/api/watchlist?email=${email}`);
    if (!response.ok) throw new Error('Failed to fetch watchlists');
    return response.json();
  },

  // Create a new watchlist
  async createWatchlist(data: {
    email: string;
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
    email: string;
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
   async deleteWatchlist(id: string, email: string) {
  let url: string;

  if (id.startsWith("cm")) {
    // cm → database ID
    url = `/api/watchlist/${id}?email=${email}`;
  } else {
    // otherwise → marketId
    url = `/api/watchlist/${id}?email=${email}`;
  }

  const response = await fetch(url, { method: "DELETE" });

  if (!response.ok) throw new Error("Failed to delete watchlist");

  return response.json();
},

  // Cre,ate multiple watchlists at once
  async createBatchWatchlists(email: string, watchLists: Array<{
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
      body: JSON.stringify({ email:email, watchLists })
    });
    if (!response.ok) throw new Error('Failed to create batch watchlists');
    return response.json();
  }
};