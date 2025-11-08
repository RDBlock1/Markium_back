'use client';

import { useEffect, useState } from 'react';
import { OrderBook, OrderBookEntry } from '@/types/';
import { fetchSingleOrderBook } from '@/utils/orderbook';
import { Button } from '@/components/ui/button';

interface OrderBookTableProps {
    tokenId: string; // ✅ Pass tokenId instead of asks/bids
    lastPrice?: string;
}

export default function OrderBookTable({ tokenId, lastPrice }: OrderBookTableProps) {
    const [orderBookData, setOrderBookData] = useState<OrderBook | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Fetch order book when tokenId changes
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchSingleOrderBook(tokenId);
                if (data) {
                    setOrderBookData(data);
                } else {
                    setError('No order book data found');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                console.error('Error fetching order book:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (tokenId) {
            fetchData();
        }
    }, [tokenId]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="text-center text-zinc-400 py-8">
                Loading order book...
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="text-center text-red-500 py-8">
                Error: {error}
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="ml-4"
                >
                    Retry
                </Button>
            </div>
        );
    }

    // Show empty state
    if (!orderBookData) {
        return (
            <div className="text-center text-zinc-400 py-8">
                No order book data available
            </div>
        );
    }

    const { asks, bids } = orderBookData;

    // ... rest of your existing formatting functions ...
    const calculateTotal = (price: string, size: string): string => {
        const priceValue = parseFloat(price);
        const shares = parseFloat(size);
        const total = priceValue * shares;
        return `$${total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatPrice = (price: string): string => {
        return `${Math.round(parseFloat(price) * 100)}¢`;
    };

    const formatShares = (size: string): string => {
        const value = parseFloat(size);
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const maxSize = Math.max(
        ...asks.map(a => parseFloat(a.size)),
        ...bids.map(b => parseFloat(b.size))
    );

    const sortedAsks = [...asks].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    const sortedBids = [...bids].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));


    return (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
            <table className="w-full text-sm md:text-base">
                <thead className="sticky top-0 bg-black z-20">
                    <tr className="border-b border-zinc-700">
                        <th className="text-left py-3 text-zinc-400 font-semibold bg-black">Type</th>
                        <th className="text-left py-3 text-zinc-400 font-semibold bg-black"></th>
                        <th className="text-right py-3 px-2 md:px-4 text-zinc-400 font-semibold bg-black">Price</th>
                        <th className="text-right py-3 px-2 md:px-4 text-zinc-400 font-semibold bg-black">Shares</th>
                        <th className="text-right py-3 px-2 md:px-4 text-zinc-400 font-semibold bg-black">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Asks Section - All entries */}
                    {sortedAsks.map((ask, index) => {
                        const sizePercent = (parseFloat(ask.size) / maxSize) * 100;
                        return (
                            <tr
                                key={`ask-${index}`}
                                className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors relative"
                            >
                                {/* Background visualization */}
                                <td className="hidden md:block absolute inset-0 pointer-events-none">
                                    <div
                                        className="h-full bg-red-500/10"
                                        style={{
                                            width: `${sizePercent}%`,
                                            marginLeft: 'auto',
                                        }}
                                    />
                                </td>

                                <td className=' md:hidden'>

                                </td>
                                <td className="py-3 text-white relative z-10">
                                    {index === 0 ? 'Asks' : ''}
                                </td>
                                <td className="text-right py-3 px-2 md:px-4 text-red-500 font-semibold relative z-10">
                                    {formatPrice(ask.price)}
                                </td>
                                <td className="text-right py-3 px-2 md:px-4 text-white relative z-10">
                                    {formatShares(ask.size)}
                                </td>
                                <td className="text-right py-3 px-2 md:px-4 text-white relative z-10">
                                    {calculateTotal(ask.price, ask.size)}
                                </td>
                            </tr>
                        );
                    })}

                    {/* Last Price Row */}
                    {lastPrice && (
                        <tr className="border-b-2 border-zinc-700 hover:bg-zinc-900 transition-colors bg-zinc-900/30 sticky z-10" style={{ top: '48px' }}>
                            <td className="py-3 text-white font-semibold bg-zinc-900/50">Last</td>
                            <td className="text-right py-3 px-2 md:px-4 text-emerald-400 font-semibold bg-zinc-900/50">
                                {formatPrice(lastPrice)}
                            </td>
                            <td className="text-right py-3 px-2 md:px-4 text-white bg-zinc-900/50">—</td>
                            <td className="text-right py-3 px-2 md:px-4 text-white bg-zinc-900/50">—</td>
                        </tr>
                    )}

                    {/* Bids Section - All entries */}
                    {sortedBids.map((bid, index) => {
                        const sizePercent = (parseFloat(bid.size) / maxSize) * 100;
                        return (
                            <tr
                                key={`bid-${index}`}
                                className="border-b border-zinc-800 hover:bg-zinc-900 transition-colors relative"
                            >
                                {/* Background visualization */}

                                <td className="hidden md:block absolute inset-0 pointer-events-none">
                                    <div
                                        className="h-full bg-green-500/10"
                                        style={{
                                            width: `${sizePercent}%`,
                                            marginLeft: 'auto',
                                        }}
                                    />
                                </td>

                                <td className=' md:hidden'>

                                </td>

                                <td className="py-3 text-white relative z-10">
                                    {index === 0 ? 'Bids' : ''}
                                </td>
                                <td className="text-right py-3 px-2 md:px-4 text-emerald-400 font-semibold relative z-10">
                                    {formatPrice(bid.price)}
                                </td>
                                <td className="text-right py-3 px-2 md:px-4 text-white relative z-10">
                                    {formatShares(bid.size)}
                                </td>
                                <td className="text-right py-3 px-2 md:px-4 text-white relative z-10">
                                    {calculateTotal(bid.price, bid.size)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}