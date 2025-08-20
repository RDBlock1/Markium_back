'use client'
import useClobAPIStore from "@/store/clobAPIState";
import { ClobClient } from "@polymarket/clob-client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";

export default function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Local state for initialization status
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Add a ref to prevent duplicate initialization attempts
  const initializationInProgress = useRef(false);
  
  // Use ALL relevant store state including credentials
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

  const host = "https://clob.polymarket.com";
  const chainId = 137;

  const initializeClobClient = async (): Promise<void> => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    // Double-check we're not already initialized
    if (initializedAddress === address && clobClient && isApiReady) {
      console.log('Client already initialized, skipping...');
      return;
    }

    // Prevent concurrent initialization
    if (initializationInProgress.current) {
      console.log('Initialization already in progress, skipping...');
      return;
    }

    initializationInProgress.current = true;

    try {
      console.log('Initializing CLOB client for address:', address);
      setApiReady(false);
      setInitializationError(null);

      // Convert viem wallet client to ethers signer
      const provider = new ethers.providers.Web3Provider(
        walletClient.transport as any
      );
      const signer = provider.getSigner();

      let creds;
      
      // Check if we have stored credentials for this address
      if (apiCredentials && initializedAddress === address) {
        console.log('Using stored API credentials');
        creds = apiCredentials;
      } else {
        // Create initial client without credentials for API key creation
        let client = new ClobClient(
          host,
          chainId,
          signer,
          undefined,
          0 // SignatureType.EOA
        );

        console.log('Creating/deriving API credentials...');

        // Create or derive API credentials
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

        // Store the credentials
        setApiCredentials(creds);
      }

      // Create new authenticated client with credentials
      const authenticatedClient = new ClobClient(
        host,
        chainId,
        signer,
        creds,
        0
      );


      // @ts-ignore
      authenticatedClient.apiCreds = creds;

      // Test the authentication
      try {
        console.log('Testing authentication...');
        const openOrders = await authenticatedClient.getOpenOrders();
        console.log('Authentication test successful, open orders:', openOrders.length);
      } catch (testError: any) {
        console.warn('Auth test warning:', testError.message);
        // If stored credentials failed, clear them and retry
        if (apiCredentials) {
          console.log('Stored credentials failed, clearing and retrying...');
          setApiCredentials(null);
          initializationInProgress.current = false;
          return await initializeClobClient(); // Recursive retry without stored creds
        }
      }

      // Store everything in zustand
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

  // Reconstruct client from stored credentials on mount
  useEffect(() => {
    const reconstructClient = async () => {
      // Check if we have stored state but no client object (happens after page navigation)
      if (initializedAddress === address && apiCredentials && !clobClient && walletClient) {
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
          // Clear stored state and re-initialize
          reset();
        }
      }
    };

    reconstructClient();
  }, [address, apiCredentials, clobClient, initializedAddress, walletClient, setClobClient, setApiReady, reset]);

  // Effect to handle wallet connection changes
  useEffect(() => {
    // Skip if not connected or no wallet client
    if (!isConnected || !walletClient || !address) {
      // Handle disconnection
      if (!isConnected && initializedAddress) {
        console.log('Wallet disconnected, resetting state');
        reset();
        setInitializationError(null);
      }
      return;
    }

    // Check if address changed (user switched accounts)
    if (initializedAddress && initializedAddress !== address) {
      console.log('Address changed from', initializedAddress, 'to', address, '- resetting state');
      reset();
      setInitializationError(null);
      return;
    }

    // CRITICAL CHECK: Skip if already initialized for this address
    if (initializedAddress === address && clobClient && isApiReady) {
      console.log('Already initialized for address:', address, '- skipping initialization');
      return;
    }

    // Skip if we have credentials for this address (will be reconstructed)
    if (initializedAddress === address && apiCredentials) {
      console.log('Have stored credentials for address:', address, '- waiting for reconstruction');
      return;
    }

    // Skip if already initializing
    if (isInitializing || initializationInProgress.current) {
      console.log('Initialization already in progress - skipping');
      return;
    }

    // Initialize only if we need to
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
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, walletClient, initializedAddress, apiCredentials]);

  // Manual retry function
  const retryInitialization = async () => {
    if (isInitializing || initializationInProgress.current) return;
    
    console.log('Manual retry initiated');
    reset(); // Clear store state to force re-initialization
    setInitializationError(null);
    
    setIsInitializing(true);
    try {
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