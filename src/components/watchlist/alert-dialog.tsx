// components/watchlist/alert-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, Send, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { watchlistAPI } from "@/lib/watchlist-api"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"

export type AlertType = "price_above" | "price_below" | "price_crosses" | "yes_above" | "yes_below" | "no_above" | "no_below"

interface WatchlistAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  marketId: string
  userEmail: string
  watchlistId?: string // For editing existing alerts
  existingAlert?: {
    triggerType: string
    triggerValue: number
    frequency: string
    isEmailNotification: boolean
    isTelegramNotification: boolean
  }
  onSuccess?: () => void // Callback after successful creation/update
  marketTitle?: string // Optional market title for display
}

export function WatchlistAlertDialog({
  open,
  onOpenChange,
  marketId,
  userEmail,
  watchlistId,
  existingAlert,
  onSuccess,
  marketTitle
}: WatchlistAlertDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"price" | "percentage">("price")
  
  // Form state - Initialize with existing values if editing
  const [alertType, setAlertType] = useState<AlertType>(() => {
    if (existingAlert?.triggerType) {
      switch (existingAlert.triggerType) {
        case "PRICE_ABOVE": return "price_above"
        case "PRICE_BELOW": return "price_below"
        case "PRICE_CROSSES": return "price_crosses"
        case "YES_ABOVE": return "yes_above"
        case "YES_BELOW": return "yes_below"
        case "NO_ABOVE": return "no_above"
        case "NO_BELOW": return "no_below"
        default: return "price_above"
      }
    }
    return "price_above"
  })
  
  const [threshold, setThreshold] = useState<string>(
    existingAlert?.triggerValue ? (existingAlert.triggerValue * 100).toString() : "50"
  )
  
  const [percentageThreshold, setPercentageThreshold] = useState<number>(
    existingAlert?.triggerValue ? existingAlert.triggerValue * 100 : 50
  )
  
  const [outcome, setOutcome] = useState<"yes" | "no">("yes")
  const [percentageCondition, setPercentageCondition] = useState<"above" | "below">("above")
  
  const [cancelAfter, setCancelAfter] = useState<"expiry" | "once">(
    existingAlert?.frequency === "ONCE" ? "once" : "expiry"
  )
  
  const [notifyEmail, setNotifyEmail] = useState<boolean>(
    existingAlert?.isEmailNotification || false
  )
  
  const [notifyTelegram, setNotifyTelegram] = useState<boolean>(
    existingAlert?.isTelegramNotification || false
  )
  
  const {data:session} = useSession()
  const [email, setEmail] = useState<string>("")
  const [telegramHandle, setTelegramHandle] = useState<string>("")

  // Update alert type when tab or outcome/condition changes
  useEffect(() => {
    if (activeTab === "percentage") {
      if (outcome === "yes" && percentageCondition === "above") {
        setAlertType("yes_above")
      } else if (outcome === "yes" && percentageCondition === "below") {
        setAlertType("yes_below")
      } else if (outcome === "no" && percentageCondition === "above") {
        setAlertType("no_above")
      } else if (outcome === "no" && percentageCondition === "below") {
        setAlertType("no_below")
      }
    }
  }, [activeTab, outcome, percentageCondition])

  // Determine active tab based on existing alert type
  useEffect(() => {
    if (existingAlert?.triggerType) {
      if (["YES_ABOVE", "YES_BELOW", "NO_ABOVE", "NO_BELOW"].includes(existingAlert.triggerType)) {
        setActiveTab("percentage")
        setOutcome(existingAlert.triggerType.startsWith("YES") ? "yes" : "no")
        setPercentageCondition(existingAlert.triggerType.includes("ABOVE") ? "above" : "below")
      } else {
        setActiveTab("price")
      }
    }
  }, [existingAlert])

  const handleSubmit = async () => {

    console.log('Submitting alert:', {
      watchlistId,
      marketId,
      existingAlert,
      alertType,
      threshold,
      percentageThreshold,
      outcome,
      percentageCondition,
      cancelAfter,
      notifyEmail,
      notifyTelegram
    });

    if(!watchlistId){
      toast.success('you don\'t have a watchlist yet')
    }
    // Validation
    if (activeTab === "price") {
      if (!threshold || isNaN(parseFloat(threshold))) {
        toast.error("Invalid threshold", {
          description: "Please enter a valid number for the threshold",
        })
        return
      }
    }

    if (notifyEmail &&  !session?.user?.email) {
      toast.error("Email required", {
        description: "Please enter an email address for notifications",
      })
      return
    }

    if (notifyTelegram && !telegramHandle) {
      toast.error("Telegram handle required", {
        description: "Please enter a Telegram handle for notifications",
      })
      return
    }

    setLoading(true)

    try {
      const triggerTypeMap: Record<AlertType, string> = {
        price_above: "PRICE_ABOVE",
        price_below: "PRICE_BELOW",
        price_crosses: "PRICE_CROSSES",
        yes_above: "YES_ABOVE",
        yes_below: "YES_BELOW",
        no_above: "NO_ABOVE",
        no_below: "NO_BELOW"
      }

      const triggerValue = activeTab === "price" 
        ? parseFloat(threshold) / 100 // Convert cents to decimal for price
        : percentageThreshold / 100 // Convert percentage to decimal

      const data = {
        email: session?.user?.email || "",
        marketId,
        triggerType: triggerTypeMap[alertType],
        triggerValue,
        frequency: cancelAfter === "once" ? "ONCE" : "IMMEDIATE",
        isEmailNotification: notifyEmail,
        isTelegramNotification: notifyTelegram,
      }

      let result
      if (watchlistId) {
        // Update existing watchlist
        result = await watchlistAPI.updateWatchlist(watchlistId, {
          ...data,
          isActive: true,
          email: session?.user?.email || ""
        })
        toast.success("Alert updated", {
          description: "Your alert has been successfully updated",
        })
      } else {
        // Create new watchlist
        result = await watchlistAPI.createWatchlist({
          ...data,
          email: session?.user?.email || ""
        })
        toast.success("Alert created", {
          description: "Your alert has been successfully created",
        })
      }

      console.log("Alert saved:", result)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error saving alert:", error)
      toast.error("Failed to save alert. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getAlertDescription = () => {
    if (activeTab === "price") {
      switch (alertType) {
        case "price_above":
          return `Alert when price rises above ${threshold}¢`
        case "price_below":
          return `Alert when price falls below ${threshold}¢`
        case "price_crosses":
          return `Alert when price crosses ${threshold}¢`
        default:
          return ""
      }
    } else {
      const outcomeText = outcome === "yes" ? "Yes" : "No"
      const conditionText = percentageCondition === "above" ? "above" : "below"
      return `Alert when "${outcomeText}" percentage is ${conditionText} ${percentageThreshold}%`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {watchlistId ? "Edit Alert" : "Set up alerts"}
          </DialogTitle>
          <DialogDescription>
            {marketTitle && <span className="font-medium">{marketTitle}</span>}
            {marketTitle && <br />}
            Get notified when the market hits your criteria.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "price" | "percentage")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="price">Price Alert</TabsTrigger>
            <TabsTrigger value="percentage">Percentage Alert</TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="mb-4 text-sm font-medium">Price Alert Settings</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceAlertType">Alert Type</Label>
                  <Select 
                    value={alertType} 
                    onValueChange={(v) => setAlertType(v as AlertType)}
                  >
                    <SelectTrigger id="priceAlertType">
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_above">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Price is above
                        </span>
                      </SelectItem>
                      <SelectItem value="price_below">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Price is below
                        </span>
                      </SelectItem>
                      <SelectItem value="price_crosses">Price crosses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="threshold"
                      inputMode="numeric"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="50"
                    />
                    <span className="text-sm text-muted-foreground">¢</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="percentage" className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="mb-4 text-sm font-medium">Percentage Alert Settings</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select value={outcome} onValueChange={(v) => setOutcome(v as "yes" | "no")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select 
                      value={percentageCondition} 
                      onValueChange={(v) => setPercentageCondition(v as "above" | "below")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Percentage Threshold</Label>
                    <span className="text-sm font-medium">{percentageThreshold}%</span>
                  </div>
                  <Slider
                    value={[percentageThreshold]}
                    onValueChange={(v) => setPercentageThreshold(v[0])}
                    min={1}
                    max={99}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%</span>
                    <span>50%</span>
                    <span>99%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Alert Preview */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium">Alert Preview</p>
          <p className="text-xs text-muted-foreground mt-1">{getAlertDescription()}</p>
        </div>

        {/* Cancel After Setting */}
        <div className="space-y-2">
          <Label htmlFor="cancelAfter">Cancel After</Label>
          <Select value={cancelAfter} onValueChange={(v) => setCancelAfter(v as "expiry" | "once")}>
            <SelectTrigger id="cancelAfter">
              <SelectValue placeholder="Till expiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiry">Till expiry</SelectItem>
              <SelectItem value="once">Once triggered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification channels */}
        <div className="rounded-lg border p-4">
          <p className="mb-4 text-sm font-medium">Notification Channels</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 opacity-70" />
                  <Label htmlFor="emailSwitch">Email</Label>
                </div>
                <Switch
                  id="emailSwitch"
                  checked={notifyEmail}
                  onCheckedChange={setNotifyEmail}
                  aria-label="Toggle email notifications"
                />
              </div>
              {notifyEmail && (
                <Input
                  placeholder="your@email.com"
                  value={email ? email : session?.user?.email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 opacity-70" />
                  <Label htmlFor="tgSwitch">Telegram</Label>
                </div>
                <Switch
                  id="tgSwitch"
                  checked={notifyTelegram}
                  onCheckedChange={setNotifyTelegram}
                  aria-label="Toggle Telegram notifications"
                />
              </div>
              {notifyTelegram && (
                <Input
                  placeholder="@your_handle"
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="font-semibold"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {watchlistId ? "Update Alert" : "Create Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}