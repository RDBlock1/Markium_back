/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, User, Edit2, Settings, Send } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import LoginButton from '../login-button';

type Alert = {
  id: string;
  walletAddress: string;
  tradeType: string;
  minAmount: string | null;
  market: string;
  notifyVia: string;
  telegramNotify: boolean;
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

type TelegramIntegration = {
  userName: string;
  chatId: string;
  createdAt: string;
};

type Props = {
  userAddress?: string;
};

const UserAlertSystem = ({ userAddress }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTelegramConnectOpen, setIsTelegramConnectOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    walletAddress: '',
    tradeType: 'both',
    minAmount: '',
    market: 'all',
    notifyVia: 'app',
    telegramNotify: false,
  });
  const [editForm, setEditForm] = useState({
    walletAddress: '',
    tradeType: 'both',
    minAmount: '',
    market: 'all',
    notifyVia: 'app',
    telegramNotify: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasTelegramIntegration, setHasTelegramIntegration] = useState(false);
  const [telegramIntegration, setTelegramIntegration] = useState<TelegramIntegration | null>(null);
  const [connectionToken, setConnectionToken] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const session = useSession();

  // Load alerts on component mount
  useEffect(() => {
    fetchAlerts();
    fetchNotifications();
    checkTelegramIntegration();
  }, []);

  // Update wallet address when userAddress prop changes
  useEffect(() => {
    if (userAddress) {
      setNewAlert((prev) => ({ ...prev, walletAddress: userAddress }));
    }
  }, [userAddress]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const checkTelegramIntegration = async () => {
    if (!session.data) return;

    try {
      const response = await fetch('/api/alerts/telegram');
      if (response.ok) {
        const data = await response.json();
        setHasTelegramIntegration(data.hasIntegration);
        setTelegramIntegration(data.integration);
      }
    } catch (error) {
      console.error('Error checking Telegram integration:', error);
    }
  };

  const fetchAlerts = async () => {
    setIsFetchingAlerts(true);

    if (!session.data) {
      return;
    }
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const data: Alert[] = await response.json();
        setAlerts(data);
      } else if (response.status === 401) {
        toast.error('Session expired', {
          description: 'Please log in again',
        });
      } else {
        const error = await response.json();
        toast.error('Error', {
          description: error.error || 'Failed to load alerts',
        });
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error', {
        description: 'Failed to load alerts',
      });
    } finally {
      setIsFetchingAlerts(false);
    }
  };

  const fetchNotifications = async () => {
    if (!session.data) {
      return;
    }
    try {
      const response = await fetch('/api/notifications?unreadOnly=false&limit=10');
      if (response.ok) {
        const data: Notification[] = await response.json();
        const newUnread = data.filter(
          (n) => !n.read && !notifications.find((old) => old.id === n.id)
        );

        if (newUnread.length > 0) {
          if (newUnread.length === 1) {
            toast('New Trade Alert', {
              description: `${formatAddress(newUnread[0].walletAddress)} ${newUnread[0].tradeType
                } ${newUnread[0].amount} shares of ${newUnread[0].market}`,
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

  const handleTelegramCheckboxChange = (checked: boolean) => {
    if (checked && !hasTelegramIntegration) {
      setIsTelegramConnectOpen(true);
    } else {
      setNewAlert({ ...newAlert, telegramNotify: checked });
    }
  };

  const handleEditTelegramCheckboxChange = (checked: boolean) => {
    if (checked && !hasTelegramIntegration) {
      setIsTelegramConnectOpen(true);
    } else {
      setEditForm({ ...editForm, telegramNotify: checked });
    }
  };

  const handleConnectTelegram = async () => {
    setIsConnectingTelegram(true);

    try {
      const response = await fetch('/api/alerts/telegram/init-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionToken(data.token);

        // Open Telegram with deep link
        window.open(data.telegramUrl, '_blank');

        // Start polling for connection status
        startPollingConnectionStatus(data.token);

        toast.info('Opening Telegram...', {
          description: 'Click "START" in the Telegram bot to complete connection',
        });
      } else {
        const error = await response.json();
        toast.error('Error', {
          description: error.error || 'Failed to initialize Telegram connection',
        });
      }
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      toast.error('Error', {
        description: 'Failed to connect Telegram. Please try again.',
      });
    } finally {
      setIsConnectingTelegram(false);
    }
  };

  const startPollingConnectionStatus = (token: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 2 minutes (every 2 seconds)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/alerts/telegram/connection-status/${token}`);
        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
          setIsTelegramConnectOpen(false);
          setConnectionToken(null);

          // Refresh integration status
          await checkTelegramIntegration();

          // Enable Telegram notifications
          if (editingAlert) {
            setEditForm({ ...editForm, telegramNotify: true });
          } else {
            setNewAlert({ ...newAlert, telegramNotify: true });
          }

          toast.success('Success!', {
            description: 'Telegram connected successfully',
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setConnectionToken(null);

          toast.error('Connection Timeout', {
            description: 'Please try again and click START in Telegram bot',
          });
        }
      } catch (error) {
        console.error('Error polling connection status:', error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const handleCancelTelegramConnect = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setConnectionToken(null);
    setIsTelegramConnectOpen(false);
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
          minAmount: newAlert.minAmount || null,
        }),
      });

      if (response.ok) {
        const createdAlert: Alert = await response.json();
        setAlerts([createdAlert, ...alerts]);
        setNewAlert({
          walletAddress: userAddress || '',
          tradeType: 'both',
          minAmount: '',
          market: 'all',
          notifyVia: 'app',
          telegramNotify: false,
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

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setEditForm({
      walletAddress: alert.walletAddress,
      tradeType: alert.tradeType,
      minAmount: alert.minAmount || '',
      market: alert.market,
      notifyVia: alert.notifyVia,
      telegramNotify: alert.telegramNotify || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAlert = async () => {
    if (!editingAlert) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/alerts/${editingAlert.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          minAmount: editForm.minAmount || null,
        }),
      });

      if (response.ok) {
        const updatedAlert: Alert = await response.json();
        setAlerts(alerts.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)));
        setIsEditDialogOpen(false);
        setEditingAlert(null);
        toast.success('Success', {
          description: 'Alert updated successfully',
        });
      } else {
        const error = await response.json();
        toast.error('Error', {
          description: error.error || 'Failed to update alert',
        });
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Error', {
        description: 'Failed to update alert. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlerts(alerts.filter((a) => a.id !== alertId));
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

  const formatAddress = (address: string | any[]) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderAlertCard = (alert: Alert) => (
    <Card key={alert.id}>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">{formatAddress(alert.walletAddress)}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{alert.tradeType}</Badge>
              <Badge variant="outline">{alert.market}</Badge>
              {alert.minAmount && <Badge variant="outline">Min ${alert.minAmount}</Badge>}
              <Badge variant="secondary">{alert.notifyVia}</Badge>
              {alert.telegramNotify && <Badge variant="default">Telegram</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              Created: {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditAlert(alert)}
              className="hover:text-primary"
            >
              <Edit2 className="h-4 w-4" />
            </Button>

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
                    Are you sure you want to delete this alert for wallet{' '}
                    {formatAddress(alert.walletAddress)}? This action cannot be undone.
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
        </div>
      </CardContent>
    </Card>
  );

  const renderAlertForm = (
    form: typeof newAlert | typeof editForm,
    setForm: React.Dispatch<React.SetStateAction<any>>,
    isEdit = false
  ) => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="wallet">Wallet Address to Copy</Label>
          <Input
            id="wallet"
            placeholder="0x..."
            value={form.walletAddress}
            onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
            disabled={isEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tradeType">Trade Type</Label>
          <Select
            value={form.tradeType}
            onValueChange={(value) => setForm({ ...form, tradeType: value })}
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
            value={form.minAmount}
            onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="market">Market Filter</Label>
          <Select
            value={form.market}
            onValueChange={(value) => setForm({ ...form, market: value })}
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

      <div className="space-y-3">
        <Label>Notification Method</Label>
        <div className="space-y-3">
          <Select
            value={form.notifyVia}
            onValueChange={(value) => setForm({ ...form, notifyVia: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="app">In-App Only</SelectItem>
              <SelectItem value="email">Email Only</SelectItem>
              <SelectItem value="both">Both In-App & Email</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="telegramNotify"
              checked={form.telegramNotify}
              onCheckedChange={(checked) =>
                isEdit
                  ? handleEditTelegramCheckboxChange(checked as boolean)
                  : handleTelegramCheckboxChange(checked as boolean)
              }
            />
            <div className="flex-1">
              <Label htmlFor="telegramNotify" className="cursor-pointer">
                Send Telegram notifications
              </Label>
              {hasTelegramIntegration && telegramIntegration && (
                <p className="text-xs text-muted-foreground">
                  Connected: @{telegramIntegration.userName}
                </p>
              )}
              {!hasTelegramIntegration && (
                <p className="text-xs text-muted-foreground">
                  Click checkbox to connect Telegram
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {session.data?.session.userId ? (
        <>
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
                    <div className="flex justify-between">
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
                        No active alerts. Create one to start tracking.
                      </div>
                    ) : (
                      <div className="space-y-3">{alerts.map(renderAlertCard)}</div>
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
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-4">
                        <Settings className="h-4 w-4 mr-2" />
                        <h3 className="font-medium">Create New Alert</h3>
                      </div>

                      {renderAlertForm(newAlert, setNewAlert)}

                      <Button
                        onClick={handleCreateAlert}
                        disabled={isLoading}
                        className="w-full mt-4"
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
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Active Alerts ({alerts.length})</h3>
                    </div>
                    {alerts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No active alerts. Create one above to start tracking.
                      </div>
                    ) : (
                      <div className="space-y-3">{alerts.map(renderAlertCard)}</div>
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

          {/* Edit Alert Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Alert</DialogTitle>
                <DialogDescription>
                  Update the configuration for this trading alert
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">{renderAlertForm(editForm, setEditForm, true)}</div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingAlert(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateAlert} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Alert'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Telegram Connection Dialog */}
          <Dialog open={isTelegramConnectOpen} onOpenChange={setIsTelegramConnectOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Connect Telegram</DialogTitle>
                <DialogDescription>
                  Connect your Telegram account to receive instant trade alerts
                </DialogDescription>
              </DialogHeader>

              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    How it works
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Click &quot;Connect Telegram&quot;</p>
                        <p>This will open Telegram app or web</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Click &quot;START&quot; in bot chat</p>
                        <p>This links your Telegram to your account</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Done! 🎉</p>
                        <p>You&apos;ll receive alerts instantly in Telegram</p>
                      </div>
                    </div>
                  </div>

                  {connectionToken && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Waiting for connection...</p>
                      <p className="text-xs text-muted-foreground">
                        Click START in the Telegram bot to complete the setup
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <DialogFooter>
                {connectionToken ? (
                  <Button variant="outline" onClick={handleCancelTelegramConnect}>
                    Cancel
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsTelegramConnectOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleConnectTelegram} disabled={isConnectingTelegram}>
                      {isConnectingTelegram ? (
                        'Opening...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Connect Telegram
                        </>
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div>
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-4">
              <div>You need to sign in to use this feature</div>
              <div className="">
                <LoginButton callbackUrlArgs={`/user-profile/${userAddress}`} />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default UserAlertSystem;