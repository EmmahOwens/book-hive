import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface BouncingBookLoaderProps {
  text?: string;
  className?: string;
}

export const BouncingBookLoader = ({ 
  text = 'Loading...', 
  className = '' 
}: BouncingBookLoaderProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <motion.div
        animate={{
          y: [0, -40, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <motion.div
          animate={{
            rotateX: [0, 0, 0],
            scaleY: [1, 0.85, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}
        >
          <BookOpen 
            className="w-16 h-16 text-primary"
            strokeWidth={1.5}
          />
        </motion.div>
      </motion.div>
      
      {/* Ground impact shadow */}
      <motion.div
        animate={{
          scale: [0.3, 1, 0.3],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-20 h-2 bg-primary/30 rounded-full blur-sm mt-2"
      />
      
      {text && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mt-6 text-muted-foreground font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};
