/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, User, TrendingUp, TrendingDown, Settings, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner'

// Mock API endpoint - replace with your actual backend URL
const API_URL = 'http://localhost:3001/api';

type Alert = {
  id: string;
  walletAddress: string;
  tradeType: string;
  minAmount: string;
  market: string;
  notifyVia: string;
  createdAt: string;
};

type Notification = {
  walletAddress: string;
  tradeType: string;
  amount: string;
  market: string;
  timestamp: string;
};


type Props = {
    userAddress: string;
}
const UserAlertSystem = ({ userAddress }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({
    walletAddress: userAddress,
    tradeType: 'both',
    minAmount: '',
    market: 'all',
    notifyVia: 'app'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);


  // Load alerts on component mount
  useEffect(() => {
    fetchAlerts();
    // Simulate receiving notifications (in production, use WebSocket)
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = true
      if (response) {
        const data: Alert[] = alerts
        // why this alerts is not updating after creating new alert - fix it
        setAlerts(data);
        console.log('Fetched alerts:', data); // Debug log
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);

    }
  };

  const checkNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setNotifications(prev => [...data, ...prev].slice(0, 10));
          // Show toast for new notifications
          if (data.length === 1) {
            toast( "New Trade Alert",{
              description: `${formatAddress(data[0].walletAddress)} ${data[0].tradeType} ${data[0].amount} shares of ${data[0].market}`,
            });
          } else {
            toast( "New Trade Alerts",{ 
              description: `${formatAddress(data[0].walletAddress)} ${data[0].tradeType} ${data[0].amount} shares`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlert.walletAddress) {
      toast.error("Validation Error", {
        description: "Please enter a wallet address",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response =  true
      if (response) {

        // set dummy active alert for now
        const createdAlert: Alert = {
          id: Math.random().toString(36).substr(2, 9),
          walletAddress: newAlert.walletAddress,
          tradeType: newAlert.tradeType,
          minAmount: newAlert.minAmount,
          market: newAlert.market,
          notifyVia: newAlert.notifyVia,
          createdAt: new Date().toISOString(),
        };
        setAlerts([createdAlert, ...alerts]);
        setNewAlert({
          walletAddress: userAddress,
          tradeType: 'both',
          minAmount: '',
          market: 'all',
          notifyVia: 'app'
        });
        toast.success("Success", {
          description: "Alert created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error("Error", {
        description: "Failed to create alert. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async () => {
    if (!alertToDelete) return;

    try {
      const response = await fetch(`${API_URL}/alerts/${alertToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertToDelete));
        toast.success("Success", {
          description: "Alert deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error("Error", {
        description: "Failed to delete alert. Please try again.",
      });
    } finally {
      setAlertToDelete(null);
    }
  };

  const formatAddress = (address: string | any[]) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="relative">
      {/* Bell Icon with Notifications Dropdown */}
      <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Recent Alerts</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setShowNotifications(false);
                setIsOpen(true);
              }}
              className="h-auto p-0"
            >
              Manage Alerts
            </Button>
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No new notifications
              </div>
            ) : (
              notifications.map((notif, index) => (
                <DropdownMenuItem key={index} className="p-4 focus:bg-accent cursor-pointer">
                  <div className="flex items-start space-x-3 w-full">
                    <div className={`p-2 rounded-lg ${notif.tradeType === 'buy' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {notif.tradeType === 'buy' ? 
                        <TrendingUp className="h-4 w-4 text-green-600" /> : 
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {formatAddress(notif.walletAddress)} {notif.tradeType === 'buy' ? 'bought' : 'sold'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notif.amount} shares of {notif.market}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Main Alert Configuration Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Copy Trading Alerts</DialogTitle>
            <DialogDescription>
              Set up alerts to monitor and copy trades from successful Polymarket traders
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Create New Alert Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <Settings className="h-4 w-4 mr-2" />
                    <h3 className="font-medium">Create New Alert</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wallet">Wallet Address to Copy</Label>
                        <Input
                          id="wallet"
                          readOnly
                          placeholder="0x..."
                          value={newAlert.walletAddress}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tradeType">Trade Type</Label>
                        <Select
                          value={newAlert.tradeType}
                          onValueChange={(value) => setNewAlert({...newAlert, tradeType: value})}
                        >
                          <SelectTrigger id="tradeType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Buy & Sell</SelectItem>
                            <SelectItem value="buy">Buy Only</SelectItem>
                            <SelectItem value="sell">Sell Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minAmount">Min. Trade Amount (USD)</Label>
                        <Input
                          id="minAmount"
                          type="number"
                          placeholder="100"
                          value={newAlert.minAmount}
                          onChange={(e) => setNewAlert({...newAlert, minAmount: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="market">Market Filter</Label>
                        <Select
                          value={newAlert.market}
                          onValueChange={(value) => setNewAlert({...newAlert, market: value})}
                        >
                          <SelectTrigger id="market">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Markets</SelectItem>
                            <SelectItem value="sports">Sports Only</SelectItem>
                            <SelectItem value="politics">Politics Only</SelectItem>
                            <SelectItem value="crypto">Crypto Only</SelectItem>
                            <SelectItem value="pop-culture">Pop Culture Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notification Method</Label>
                      <RadioGroup
                        value={newAlert.notifyVia}
                        onValueChange={(value) => setNewAlert({...newAlert, notifyVia: value})}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="app" id="app" />
                          <Label htmlFor="app">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="email" />
                          <Label htmlFor="email">Email</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button
                      onClick={handleCreateAlert}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        "Creating..."
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Alert
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Alerts List */}
              <div className="space-y-3">
                <h3 className="font-medium">Active Alerts ({alerts.length})</h3>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active alerts. Create one above to start tracking.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatAddress(alert.walletAddress)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline">{alert.tradeType}</Badge>
                                <Badge variant="outline">{alert.market}</Badge>
                                {alert.minAmount && (
                                  <Badge variant="outline">Min ${alert.minAmount}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(alert.createdAt).toLocaleString()}
                              </p>
                            </div>
                            
                            {/* Delete Alert with Confirmation Dialog */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this alert for wallet {formatAddress(alert.walletAddress)}? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setAlertToDelete(alert.id);
                                      handleDeleteAlert();
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserAlertSystem;