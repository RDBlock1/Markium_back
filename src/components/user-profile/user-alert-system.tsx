/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, User, TrendingUp, TrendingDown, Settings } from 'lucide-react';
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
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';


type Alert = {
  id: string;
  walletAddress: string;
  tradeType: string;
  minAmount: string | null;
  market: string;
  notifyVia: string;
  createdAt: string;
};

type Notification = {
  id: string;
  walletAddress: string;
  tradeType: string;
  amount: string;
  market: string;
  timestamp: string;
  read: boolean;
};

type Props = {
  userAddress?: string;
};

const UserAlertSystem = ({ userAddress  }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({
    walletAddress: '',
    tradeType: 'both',
    minAmount: '',
    market: 'all',
    notifyVia: 'app'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const session = useSession()

  // Load alerts on component mount
  useEffect(() => {
    fetchAlerts();
    fetchNotifications();
  }, []);

  // Update wallet address when userAddress prop changes
  useEffect(() => {
    if (userAddress) {
      setNewAlert(prev => ({ ...prev, walletAddress: userAddress }));
    }
  }, [userAddress]);

  const fetchAlerts = async () => {
    setIsFetchingAlerts(true);

    if(!session.data){
      return;
    }
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const data: Alert[] = await response.json();
        console.log('Fetched alerts:', data);
        setAlerts(data);
      } else if (response.status === 401) {
        toast.error('Session expired', {
          description: 'Please log in again'
        });
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        toast.error('Error', {
          description: error.error || 'Failed to load alerts'
        });
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error', {
        description: 'Failed to load alerts'
      });
    } finally {
      setIsFetchingAlerts(false);
    }
  };

  const fetchNotifications = async () => {
    if(!session.data){
      return;
    }
    try {
      const response = await fetch('/api/notifications?unreadOnly=false&limit=10');
      if (response.ok) {
        const data: Notification[] = await response.json();

        // Check for new unread notifications
        const newUnread = data.filter(n => !n.read && !notifications.find(old => old.id === n.id));

        if (newUnread.length > 0) {
          // Show toast for new notifications
          if (newUnread.length === 1) {
            toast('New Trade Alert', {
              description: `${formatAddress(newUnread[0].walletAddress)} ${newUnread[0].tradeType} ${newUnread[0].amount} shares of ${newUnread[0].market}`,
            });
          } else {
            toast('New Trade Alerts', {
              description: `${newUnread.length} new trade alerts`,
            });
          }
        }

        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlert.walletAddress) {
      toast.error('Validation Error', {
        description: 'Please enter a wallet address',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAlert,
          minAmount: newAlert.minAmount || null
        }),
      });

      if (response.ok) {
        const createdAlert: Alert = await response.json();
        console.log('Created alert:', createdAlert);
        setAlerts([createdAlert, ...alerts]);
        setNewAlert({
          walletAddress: userAddress || '',
          tradeType: 'both',
          minAmount: '',
          market: 'all',
          notifyVia: 'app'
        });
        toast.success('Success', {
          description: 'Alert created successfully',
        });
      } else {
        const error = await response.json();
        toast.error('Error', {
          description: error.error || 'Failed to create alert',
        });
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Error', {
        description: 'Failed to create alert. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
        toast.success('Success', {
          description: 'Alert deleted successfully',
        });
      } else {
        const error = await response.json();
        toast.error('Error', {
          description: error.error || 'Failed to delete alert',
        });
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Error', {
        description: 'Failed to delete alert. Please try again.',
      });
    }
  };

  const markNotificationsAsRead = async (notificationIds?: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          markAllRead: !notificationIds
        }),
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          read: notificationIds ? notificationIds.includes(n.id) : true
        }))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatAddress = (address: string | any[]) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
    {
      session.data?.session.userId ? 
      (
            <>  {/* Bell Icon with Notifications Dropdown */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96">
                  <div className="flex p-2">
                    <div className="flex gap-2 mx-auto w-full">
                      <div className="space-y-3 ">
                       <div className='flex justify-between'>
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Active Alerts ({alerts.length})</h3>
                            {isFetchingAlerts && (
                              <span className="text-xs text-muted-foreground">Loading...</span>
                            )}
                          </div>

                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowNotifications(false);
                                setIsOpen(true);
                              }}
                              className="h-auto p-1 text-xs"
                            >
                              Manage Alerts
                            </Button>
                          </div>
                       </div>
                        {isFetchingAlerts && alerts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Loading alerts...
                          </div>
                        ) : alerts.length === 0 ? (
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
                                      <div className="flex gap-2 flex-wrap">
                                        <Badge variant="outline">{alert.tradeType}</Badge>
                                        <Badge variant="outline">{alert.market}</Badge>
                                        {alert.minAmount && (
                                          <Badge variant="outline">Min ${alert.minAmount}</Badge>
                                        )}
                                        <Badge variant="secondary">{alert.notifyVia}</Badge>
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
                                            onClick={() => handleDeleteAlert(alert.id)}
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
                 
                  </div>
                

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
                                  placeholder="0x..."
                                  value={newAlert.walletAddress}
                                  onChange={(e) => setNewAlert({ ...newAlert, walletAddress: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tradeType">Trade Type</Label>
                                <Select
                                  value={newAlert.tradeType}
                                  onValueChange={(value) => setNewAlert({ ...newAlert, tradeType: value })}
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
                                  onChange={(e) => setNewAlert({ ...newAlert, minAmount: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="market">Market Filter</Label>
                                <Select
                                  value={newAlert.market}
                                  onValueChange={(value) => setNewAlert({ ...newAlert, market: value })}
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
                                onValueChange={(value) => setNewAlert({ ...newAlert, notifyVia: value })}
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
                                'Creating...'
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
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Active Alerts ({alerts.length})</h3>
                          {isFetchingAlerts && (
                            <span className="text-xs text-muted-foreground">Loading...</span>
                          )}
                        </div>
                        {isFetchingAlerts && alerts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Loading alerts...
                          </div>
                        ) : alerts.length === 0 ? (
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
                                      <div className="flex gap-2 flex-wrap">
                                        <Badge variant="outline">{alert.tradeType}</Badge>
                                        <Badge variant="outline">{alert.market}</Badge>
                                        {alert.minAmount && (
                                          <Badge variant="outline">Min ${alert.minAmount}</Badge>
                                        )}
                                        <Badge variant="secondary">{alert.notifyVia}</Badge>
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
                                            onClick={() => handleDeleteAlert(alert.id)}
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
        
        </>
      )
      :
      <div>
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative">
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 p-4">
               <div>
                You need sign in to use this feature
               </div>
               <div className=''>
                  {/* <LoginButton callbackUrlArgs={`/user-profile/${userAddress}`} /> */}

               </div>
              </DropdownMenuContent>
            </DropdownMenu>      </div>
    }
    </div>
  );
};

export default UserAlertSystem;