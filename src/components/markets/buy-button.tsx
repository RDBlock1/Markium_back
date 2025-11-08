/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";
import { useState, useEffect } from "react";
import {  Side, OrderType } from "@polymarket/clob-client";
import {
    useAccount,
    useWalletClient,
    usePublicClient,
    useChainId,
    useSwitchChain,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt
} from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import useClobAPIStore from "@/store/clobAPIState";


// Polymarket Exchange Contract (CTF Exchange)
const EXCHANGE_CONTRACT = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const;

// USDC Contract on Polygon
const USDC_CONTRACT = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const;

// USDC ABI (only the functions we need)
const USDC_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;

export default function BuyButton({ tokenID, amount, type, outcome }: { tokenID: string, amount: string, type: 'Buy' | 'Sell', outcome: 'Yes' | 'No' }) {
    const [loading, setLoading] = useState(false);
    const {
        clobClient,
        setClobClient,
    } = useClobAPIStore();
    const [apiReady, setApiReady] = useState(false);

    // Wagmi hooks
    const { address, isConnected, connector } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const currentChainId = useChainId();
    const { switchChain } = useSwitchChain();

    // USDC Balance
    const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
        address: USDC_CONTRACT,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        }
    });

    // USDC Allowance
    const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
        address: USDC_CONTRACT,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: address ? [address, EXCHANGE_CONTRACT] : undefined,
        query: {
            enabled: !!address,
        }
    });

    // Approve USDC
    const {
        writeContract: approveUSDC,
        data: approveHash,
        isPending: isApproving
    } = useWriteContract();

    const { isLoading: isApprovalConfirming } = useWaitForTransactionReceipt({
        hash: approveHash,
    });

    // Format balances for display
    const formattedBalance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";
    const formattedAllowance = usdcAllowance ? formatUnits(usdcAllowance, 6) : "0";




    const handleApprove = async () => {
        if (!address) return;

        try {
            // Approve a large amount (1 million USDC)
            const amountToApprove = parseUnits("1000000", 6);

            approveUSDC({
                address: USDC_CONTRACT,
                abi: USDC_ABI,
                functionName: 'approve',
                args: [EXCHANGE_CONTRACT, amountToApprove],
            });
        } catch (error) {
            console.error('Approval failed:', error);
        }
    };

    // Refetch balances after approval confirms
    useEffect(() => {
        if (approveHash && !isApprovalConfirming) {
            refetchBalance();
            refetchAllowance();
        }
    }, [approveHash, isApprovalConfirming, refetchBalance, refetchAllowance]);

    const placeOrder = async () => {
        if (!isConnected || !clobClient || !walletClient) {
            alert("Please wait for wallet and API initialization to complete");
            return;
        }

        //take approve
        if (needsApproval) {
            await handleApprove();
        }

        // Check if user has enough USDC
        if (parseFloat(formattedBalance) < Number(amount)) {
            alert(`Insufficient USDC balance. You have ${formattedBalance} USDC but need at least ${amount} USDC.`);
            return;
        }

        // Check if allowance is sufficient
        if (parseFloat(formattedAllowance) < Number(amount)) {
            alert('You need to approve USDC spending first. Click the "Approve USDC" button.');
            return;
        }

        setLoading(true);
        try {
            console.log('Starting order placement...');

            // Create order parameters
            const orderParams = {
                tokenID: tokenID,
                price: Number(amount),
                side: Side.BUY,
                size: 5,
            };

            const orderOptions = {
                tickSize: Number(amount),
                negRisk: false
            };

            console.log('Creating order...');
            //@ts-ignore
            const order = await clobClient.createOrder(orderParams, orderOptions);
            console.log('Order created:', order);

            console.log('Posting order...');
            const orderResponse = await clobClient.postOrder(order, OrderType.GTC);

            console.log("Order response:", orderResponse);

            const orderStatus = await clobClient.getOrder(orderResponse.orderID);
            console.log("Order status 🚀:", orderStatus);

            if (orderResponse.error) {
                throw new Error(orderResponse.error);
            }

            if (orderResponse.success === false) {
                throw new Error(orderResponse.errorMsg || 'Order placement failed');
            }

            // Refresh balances
            refetchBalance();
            refetchAllowance();

            alert(`✅ Order placed successfully! ${orderResponse.orderID ? `Order ID: ${orderResponse.orderID}` : ''}`);

        } catch (err: any) {
            console.error("❌ Order placement error:", err);
            alert(`Order failed: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const needsApproval = parseFloat(formattedAllowance) < 0.01;

    return (
        <div className="flex flex-col gap-3">

            {/* Place Order Button */}
            <button
                onClick={placeOrder}
                disabled={!isConnected || parseFloat(formattedBalance) < Number(amount)}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${!isConnected || parseFloat(formattedBalance) < Number(amount)
                        ? "bg-gray-400 cursor-not-allowed text-gray-200"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
            >
                {loading ? "Placing Order..." : ` ${type} ${amount} ${outcome}`}
            </button>

            {/* Additional Info */}
            {/* <div className="text-xs text-gray-500 mt-2 space-y-1 bg-gray-50 p-2 rounded">
        <p className="font-medium">ℹ️ Info:</p>
        <p>• Token ID: {tokenID.slice(0, 10)}...</p>
        <p>• Exchange: {EXCHANGE_CONTRACT.slice(0, 10)}...</p>
        <p>• Order size: 1 share @ $0.01</p>
      </div> */}
        </div>
    );
}