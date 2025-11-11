// hooks/useUserCreation.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface CreateUserResponse {
  user: {
    id: string;
    walletAddress: string;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
  isNewUser: boolean;
}

export const useUserCreation = () => {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userCreationError, setUserCreationError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CreateUserResponse['user'] | null>(null);
  
  // Track processed addresses to prevent duplicate calls
  const processedAddresses = useRef<Set<string>>(new Set());
  // Track if we're currently processing to prevent race conditions
  const processingRef = useRef(false);

  const createOrGetUser = useCallback(async (walletAddress: string): Promise<CreateUserResponse | null> => {
    if (!walletAddress) {
      setUserCreationError('Wallet address is required');
      return null;
    }

    const normalizedAddress = walletAddress.toLowerCase();
    
    // Check if we've already processed this address
    if (processedAddresses.current.has(normalizedAddress)) {
      console.log('User already processed for address:', normalizedAddress);
      return null;
    }

    // If already processing, skip
    if (processingRef.current) {
      console.log('User creation already in progress');
      return null;
    }

    // Mark as processing
    processingRef.current = true;
    processedAddresses.current.add(normalizedAddress);

    setIsCreatingUser(true);
    setUserCreationError(null);

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: normalizedAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create/get user');
      }

      const data: CreateUserResponse = await response.json();
      console.log(data.message, data.user);
      
      // Store the current user
      setCurrentUser(data.user);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUserCreationError(errorMessage);
      console.error('User creation error:', errorMessage);
      
      // Remove from processed addresses on error so it can be retried
      processedAddresses.current.delete(normalizedAddress);
      return null;
    } finally {
      setIsCreatingUser(false);
      processingRef.current = false;
    }
  }, []);

  const getUserByWalletAddress = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/user?walletAddress=${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // User not found
        }
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    processedAddresses.current.clear();
    processingRef.current = false;
    setUserCreationError(null);
    setCurrentUser(null);
  }, []);

  return {
    createOrGetUser,
    getUserByWalletAddress,
    isCreatingUser,
    userCreationError,
    currentUser,
    reset,
  };
};