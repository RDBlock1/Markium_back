"use client"

import { motion } from "framer-motion"

interface TabsComponentProps {
    tabs: string[]
    selectedTab: string
    setSelectedTab: (tab: string) => void
}

export default function TabsComponent({ tabs, selectedTab, setSelectedTab }: TabsComponentProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 },
    }

    return (
        <motion.div
            className="flex gap-2 mb-8 overflow-x-auto pb-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {tabs.map((tab) => (
                <motion.button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-all font-medium text-sm ${selectedTab === tab ? "bg-cyan-500 text-black font-semibold" : "bg-card text-foreground hover:bg-secondary"
                        }`}
                >
                    {tab}
                </motion.button>
            ))}
        </motion.div>
    )
}
