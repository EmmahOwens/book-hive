import { motion } from 'framer-motion';

export const GlassBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50" />
      
      {/* Animated gradient blobs */}
      <motion.div
        className="absolute top-0 -left-20 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/3 -right-20 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.1, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -100, 0],
          scale: [1, 1.15, 1],
          rotate: [0, 180, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%)',
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
          rotate: [0, -180, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Mesh gradient overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(240, 147, 251, 0.15) 0%, transparent 50%)',
        }}
      />
    </div>
  );
};
