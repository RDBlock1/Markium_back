"use client"

import { motion, Variants } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMobile } from "@/hooks/use-mobile"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import useClobAPIStore from "@/store/clobAPIState"

function formatOrderId(id: string) {
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}

function formatDate(unixTime: number) {
    return new Date(unixTime * 1000).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "LIVE":
      return "default"
    case "EXPIRED":
      return "destructive"
    default:
      return "secondary"
  }
}

function getSideBadgeColor(side: string) {
  return side === "BUY"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
}

interface MyOrder{
    id: string;
    status: string;
    owner: string;
    maker_address: string;
    market: string;
    asset_id: string;
    side: string;
    original_size: string;
    size_matched: string;
    price: string;
    outcome: string;
    expiration: string;
    order_type: string;
    associate_trades: any[];
    created_at: number;
}

type CurrentMarketTokens = {
  yesTokenId:string;
  noTokenId:string;
}

export function MyOrdersTable(currentMarketTokens: CurrentMarketTokens) {
  const isMobile = useMobile()
  const [myOrders, setMyOrders] = useState<MyOrder[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  
  // Get the CLOB client from the centralized store
  const { clobClient, isApiReady } = useClobAPIStore();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  // Fetch orders function
  const fetchOrders = async () => {
    if (!clobClient || !isApiReady) {
      console.log("Client not ready for fetching orders");
      return;
    }

    try {
      console.log("Fetching open orders...");
      const openOrders = await clobClient.getOpenOrders();
      console.log(`Found ${openOrders.length} orders`);
      //filter order those orders which yes and no token id is match with asset_id
      const filteredOrders = openOrders.filter(order => {
        return order.asset_id === currentMarketTokens.yesTokenId || order.asset_id === currentMarketTokens.noTokenId;
      });
      setMyOrders(filteredOrders);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to fetch orders");
    }
  };

  // Initial fetch when client becomes ready
  useEffect(() => {
    if (clobClient && isApiReady && address) {
      console.log("CLOB client ready, fetching initial orders...");
      setIsLoading(true);
      fetchOrders().finally(() => setIsLoading(false));
    } else if (!isConnected) {
      // Clear orders when disconnected
      setMyOrders([]);
      setError(null);
    }
  }, [clobClient, isApiReady, address, isConnected]);

  // Set up polling for order updates
  useEffect(() => {
    if (!clobClient || !isApiReady || !address) return;

    // Set up polling interval (every 10 seconds)
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, [clobClient, isApiReady, address]);

  const handleCancelOrder = async (orderId: string) => {
    if (!clobClient || !isApiReady) {
      alert("Trading client not ready. Please wait...");
      return;
    }

    try {
      console.log("Cancelling order:", orderId);
      setIsLoading(true);
      await clobClient.cancelOrder({ orderID: orderId });
      
      // Refresh orders after cancellation
      await fetchOrders();
      
      alert("Order cancelled successfully!");
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      alert(`Failed to cancel order: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshOrders = async () => {
    if (!clobClient || !isApiReady) {
      console.log("Client not ready for refresh");
      return;
    }
    

    setIsLoading(true);
    await fetchOrders();
    setIsLoading(false);
  };

  // Show connection status if not connected
  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">📑 My Orders</h2>
        <p className="text-muted-foreground">Please connect your wallet to view orders</p>
      </div>
    );
  }

  // Show initialization status
  if (isConnected && !isApiReady) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">📑 My Orders</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Initializing trading client...</p>
        <p className="text-xs text-muted-foreground mt-2">
          This may take a moment on first connection
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight">📑 My Orders</h2>
        <p className="text-muted-foreground mt-2">Track and manage your trading orders</p>
        
        {/* Status indicators */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isApiReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isApiReady ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          
          {/* Refresh button */}
          <Button 
            onClick={handleRefreshOrders} 
            disabled={!isApiReady || isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? "Loading..." : "Refresh Orders"}
          </Button>
        </div>
      </motion.div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={handleRefreshOrders} 
            variant="outline" 
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !error && myOrders.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading orders...</p>
        </div>
      )}

      {/* No orders state */}
      {!isLoading && isApiReady && myOrders.length === 0 && !error && (
        <div className="text-center py-8 bg-muted/50 rounded-lg">
          <p className="text-lg font-medium">No Active Orders</p>
          <p className="text-muted-foreground mt-2">You don't have any open orders at the moment</p>
          <Button 
            onClick={handleRefreshOrders} 
            variant="outline" 
            size="sm"
            className="mt-4"
          >
            Check Again
          </Button>
        </div>
      )}

      {/* Desktop Table View */}
      {!isMobile && myOrders.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="rounded-lg border bg-card shadow-sm"
        >
          <Table className="bg-black">
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Filled</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myOrders.map((order) => (
                <motion.tr 
                  key={order.id} 
                  variants={itemVariants} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-mono text-sm">{formatOrderId(order.id)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(order.status)}
                      className={
                        order.status === "LIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : order.status === "EXPIRED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : ""
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSideBadgeColor(order.side)}>
                      {order.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">${Number(order.price).toFixed(3)}</TableCell>
                  <TableCell>{Number(order.original_size).toLocaleString()}</TableCell>
                  <TableCell>{Number(order.size_matched || 0).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {order.market ? formatOrderId(order.market) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={order.status !== "LIVE" || isLoading}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Mobile Card View */}
      {isMobile && myOrders.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
          {myOrders.map((order) => (
            <motion.div key={order.id} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {/* Order ID and Status Row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      {formatOrderId(order.id)}
                    </span>
                    <Badge
                      variant={getStatusBadgeVariant(order.status)}
                      className={
                        order.status === "LIVE"
                          ? "bg-green-100 text-green-800"
                          : order.status === "EXPIRED"
                            ? "bg-red-100 text-red-800"
                            : ""
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>

                  {/* Side and Price Row */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getSideBadgeColor(order.side)}>
                      {order.side}
                    </Badge>
                    <span className="font-mono font-semibold">${Number(order.price).toFixed(3)}</span>
                  </div>

                  {/* Size and Filled Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Size: </span>
                      <span className="font-medium">{Number(order.original_size).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Filled: </span>
                      <span className="font-medium">{Number(order.size_matched || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Market */}
                  {order.market && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Market: </span>
                      <span className="font-mono">{formatOrderId(order.market)}</span>
                    </div>
                  )}

                  {/* Created At and Cancel Button */}
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={order.status !== "LIVE" || isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}