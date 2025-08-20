export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value > 1000000 ? "compact" : "standard",
    maximumFractionDigits: value > 1000000 ? 1 : 0,
  }).format(value)
}

export const formatPercentage = (value: string | number): string => {
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  return `${(numValue * 100).toFixed(1)}%`
}

export const calculateTimeLeft = (endDate: string): string => {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return "Ended"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours} hours`
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes} minutes`
  }
}

export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}
