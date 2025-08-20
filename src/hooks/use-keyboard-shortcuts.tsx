// "use client"

// import { useEffect } from "react"

// interface KeyboardShortcutsProps {
//   onBuy?: () => void
//   onSell?: () => void
//   onRefresh?: () => void
// }

// export function useKeyboardShortcuts({ onBuy, onSell, onRefresh }: KeyboardShortcutsProps) {
//   useEffect(() => {
//     const handleKeyPress = (event: KeyboardEvent) => {
//       // Don't trigger shortcuts when typing in inputs
//       if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
//         return
//       }

//       switch (event.key.toLowerCase()) {
//         case "b":
//           event.preventDefault()
//           onBuy?.()
//           break
//         case "s":
//           event.preventDefault()
//           onSell?.()
//           break
//         case "r":
//           if (event.ctrlKey || event.metaKey) {
//             event.preventDefault()
//             onRefresh?.()
//           }
//           break
//       }
//     }

//     document.addEventListener("keydown", handleKeyPress)
//     return () => document.removeEventListener("keydown", handleKeyPress)
//   }, [onBuy, onSell, onRefresh])
// }
