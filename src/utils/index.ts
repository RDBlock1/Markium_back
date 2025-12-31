


export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  export const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`
    }
    return `$${Number(volume).toFixed(0)}`
  }


export function toLocalString(dateStr: string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!dateStr) {
    return "—";
  }

  try {
    // Log the original date string for debugging

    // Handle different date formats
    let dateToProcess = dateStr;

    // If the date has microseconds (more than 3 digits after decimal), trim them
    if (dateStr.includes('.') && dateStr.includes('Z')) {
      dateToProcess = dateStr.replace(/(\.\d{3})\d+Z$/, "$1Z");
    }

    // Try parsing the date
    const date = new Date(dateToProcess);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date after parsing:", dateToProcess);
      return "—";
    }

    // Format the date (you can customize this)
    const formatted = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return formatted;

  } catch (error) {
    console.error("Error parsing date:", error, "Original string:", dateStr);
    return "—";
  }
}

