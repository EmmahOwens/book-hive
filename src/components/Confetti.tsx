import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

export const Confetti = ({ active, duration = 3000 }: ConfettiProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!show) return null;

  const colors = ['#0EA5E9', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    x: Math.random() * 100,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ 
              y: -20, 
              x: `${piece.x}vw`,
              rotate: piece.rotation,
              opacity: 1,
              scale: 1
            }}
            animate={{ 
              y: '110vh',
              rotate: piece.rotation + 720,
              opacity: 0,
              scale: 0.5
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2 + Math.random(),
              delay: piece.delay,
              ease: "easeIn"
            }}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              backgroundColor: piece.color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
