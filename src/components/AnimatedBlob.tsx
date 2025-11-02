import { motion } from 'framer-motion';

interface AnimatedBlobProps {
  className?: string;
  delay?: number;
}

export const AnimatedBlob = ({ className = '', delay = 0 }: AnimatedBlobProps) => {
  return (
    <motion.div
      className={`absolute rounded-full mix-blend-multiply filter blur-xl ${className}`}
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
        scale: [1, 1.1, 1],
        rotate: [0, 90, 0],
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};
