'use client';

import useClobAPIStore from "@/store/clobAPIState";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useUserCreation } from "@/hooks/useUserCreation";

// Dynamic import for ClobClient to ensure it's only loaded client-side
let ClobClient: any = null;

export default function WalletConnectButtonClient() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [clientLoaded, setClientLoaded] = useState(false);
  
  const initializationInProgress = useRef(false);
  // Track the last processed address to prevent duplicate user creation
  const lastProcessedAddress = useRef<string | null>(null);
  
  const { 
    clobClient, 
    setClobClient,
    isApiReady,
    setApiReady,
    initializedAddress,
    setInitializedAddress,
    apiCredentials,
    setApiCredentials,
    reset
  } = useClobAPIStore();

  // Add user creation hook
  const { 
    createOrGetUser, 
    isCreatingUser, 
    userCreationError, 
    currentUser,
    reset: resetUserCreation 
  } = useUserCreation();

  const host = "https://clob.polymarket.com";
  const chainId = 137;

  // Load ClobClient dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !ClobClient) {
      import('@polymarket/clob-client').then((module) => {
        ClobClient = module.ClobClient;
        setClientLoaded(true);
        console.log('ClobClient loaded successfully');
      }).catch((error) => {
        console.error('Failed to load ClobClient:', error);
        setInitializationError('Failed to load trading client');
      });
    }
  }, []);

  // Create user when wallet is connected - FIXED VERSION
  useEffect(() => {
    // Only process if connected, have an address, and it's different from last processed
    if (isConnected && address && address !== lastProcessedAddress.current) {
      console.log('Processing user creation for new address:', address);
      lastProcessedAddress.current = address;
      
      createOrGetUser(address).then((result) => {
        if (result) {
          console.log(`User ${result.isNewUser ? 'created' : 'retrieved'} successfully:`, result.user.id);
        }
      });
    }
    
    // Reset when disconnected
    if (!isConnected && lastProcessedAddress.current) {
      console.log('Wallet disconnected, resetting user state');
      lastProcessedAddress.current = null;
      resetUserCreation();
    }
  }, [isConnected, address, createOrGetUser, resetUserCreation]);

  const initializeClobClient = async (): Promise<void> => {
    if (!walletClient || !address || !ClobClient) {
      throw new Error('Prerequisites not met');
    }

    if (initializedAddress === address && clobClient && isApiReady) {
      console.log('Client already initialized, skipping...');
      return;
    }

    if (initializationInProgress.current) {
      console.log('Initialization already in progress, skipping...');
      return;
    }

    initializationInProgress.current = true;

    try {
      console.log('Initializing CLOB client for address:', address);
      setApiReady(false);
      setInitializationError(null);

      const provider = new ethers.providers.Web3Provider(
        walletClient.transport as any
      );
      const signer = provider.getSigner();

      let creds;
      
      if (apiCredentials && initializedAddress === address) {
        console.log('Using stored API credentials');
        creds = apiCredentials;
      } else {
        let client = new ClobClient(
          host,
          chainId,
          signer,
          undefined,
          0
        );

        console.log('Creating/deriving API credentials...');

        try {
          creds = await client.deriveApiKey();
          console.log('Derived existing API credentials');
        } catch (deriveError: any) {
          console.log('No existing credentials found, creating new ones...');
          try {
            creds = await client.createApiKey();
            console.log('Created new API credentials');
          } catch (createError: any) {
            console.log('Trying createOrDeriveApiKey...');
            creds = await client.createOrDeriveApiKey();
            console.log('Got API credentials via createOrDeriveApiKey');
          }
        }

        if (!creds || !creds.key || !creds.secret || !creds.passphrase) {
          throw new Error('Invalid API credentials received');
        }

        setApiCredentials(creds);
      }

      const authenticatedClient = new ClobClient(
        host,
        chainId,
        signer,
        creds,
        0
      );

      // @ts-ignore
      authenticatedClient.apiCreds = creds;

      try {
        console.log('Testing authentication...');
        const openOrders = await authenticatedClient.getOpenOrders();
        console.log('Authentication test successful, open orders:', openOrders.length);
      } catch (testError: any) {
        console.warn('Auth test warning:', testError.message);
        if (apiCredentials) {
          console.log('Stored credentials failed, clearing and retrying...');
          setApiCredentials(null);
          initializationInProgress.current = false;
          return await initializeClobClient();
        }
      }

      setClobClient(authenticatedClient);
      setInitializedAddress(address);
      setApiReady(true);
      console.log('CLOB client initialized and authenticated successfully');

    } catch (error) {
      console.error('Failed to initialize CLOB client:', error);
      setApiReady(false);
      setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      initializationInProgress.current = false;
    }
  };

  useEffect(() => {
    const reconstructClient = async () => {
      if (initializedAddress === address && apiCredentials && !clobClient && walletClient && ClobClient) {
        console.log('Reconstructing client from stored credentials...');
        
        try {
          const provider = new ethers.providers.Web3Provider(
            walletClient.transport as any
          );
          const signer = provider.getSigner();
          
          const authenticatedClient = new ClobClient(
            host,
            chainId,
            signer,
            apiCredentials,
            0
          );

          // @ts-ignore
          authenticatedClient.apiCreds = apiCredentials;
          setClobClient(authenticatedClient);
          setApiReady(true);
          console.log('Client reconstructed successfully');
        } catch (error) {
          console.error('Failed to reconstruct client:', error);
          reset();
        }
      }
    };

    if (clientLoaded) {
      reconstructClient();
    }
  }, [address, apiCredentials, clobClient, initializedAddress, walletClient, setClobClient, setApiReady, reset, clientLoaded]);

  useEffect(() => {
    if (!isConnected || !walletClient || !address || !clientLoaded) {
      if (!isConnected && initializedAddress) {
        console.log('Wallet disconnected, resetting state');
        reset();
        setInitializationError(null);
      }
      return;
    }

    if (initializedAddress && initializedAddress !== address) {
      console.log('Address changed from', initializedAddress, 'to', address, '- resetting state');
      reset();
      setInitializationError(null);
      return;
    }

    if (initializedAddress === address && clobClient && isApiReady) {
      console.log('Already initialized for address:', address, '- skipping initialization');
      return;
    }

    if (initializedAddress === address && apiCredentials) {
      console.log('Have stored credentials for address:', address, '- waiting for reconstruction');
      return;
    }

    if (isInitializing || initializationInProgress.current) {
      console.log('Initialization already in progress - skipping');
      return;
    }

    const initialize = async () => {
      console.log('Starting initialization for address:', address);
      setIsInitializing(true);

      try {
        await initializeClobClient();
      } catch (error) {
        console.error('Initialization failed:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
    
  }, [isConnected, address, walletClient, initializedAddress, apiCredentials, clientLoaded]);

  const retryInitialization = async () => {
    if (isInitializing || initializationInProgress.current || !clientLoaded) return;
    
    console.log('Manual retry initiated');
    reset();
    resetUserCreation();
    setInitializationError(null);
    lastProcessedAddress.current = null; // Reset to allow re-creation
    
    setIsInitializing(true);
    try {
      // Re-create user if needed
      if (address && address !== lastProcessedAddress.current) {
        lastProcessedAddress.current = address;
        await createOrGetUser(address);
      }
      
      await initializeClobClient();
    } catch (error) {
      console.error('Retry failed:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="space-y-4">
      <ConnectButton
        showBalance={{
          smallScreen: false,
          largeScreen: true,
        }}
        chainStatus="icon"
      />
      
 
    </div>
  );    
}