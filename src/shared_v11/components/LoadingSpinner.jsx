import { motion } from "framer-motion";

/**
 * Reusable loading spinner component for v1.1
 * Consistent loading states across the application
 */
export default function LoadingSpinner({ 
  size = "medium", 
  color = "primary", 
  text = "Loading...",
  showText = true 
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    white: "text-white",
    gray: "text-gray-500"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-current border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {showText && (
        <motion.p
          className={`text-sm ${colorClasses[color]} font-medium`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Full screen loading overlay
 */
export function LoadingOverlay({ text = "Loading..." }) {
  return (
    <motion.div
      className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="large" text={text} />
      </div>
    </motion.div>
  );
}

/**
 * Inline loading spinner for buttons and small areas
 */
export function InlineSpinner({ size = "small", color = "white" }) {
  return (
    <motion.div
      className={`${size === "small" ? "w-4 h-4" : "w-6 h-6"} ${color === "white" ? "text-white" : "text-primary"} border-2 border-current border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}
