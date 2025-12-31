'use client';

import { motion } from "framer-motion";


export default function HeadingMarkets() {
    return (
         <div className="container mx-auto mb-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 flex flex-col items-center justify-center"
            >
                <h2 className="text-5xl md:text-7xl text-center font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                    Explore Markets
                </h2>
                <div className="h-[1px]  w-24 bg-zinc-900 dark:bg-zinc-100" />
            </motion.div>
        </div>
    );
}
    