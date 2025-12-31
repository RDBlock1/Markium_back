'use client';

import { motion } from 'framer-motion';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`text-center ${className}`}>
      <motion.h1
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          className="text-lg text-muted-foreground max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
