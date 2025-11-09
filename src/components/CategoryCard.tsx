import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  count: number;
  description: string;
  gradient: string;
  onClick: () => void;
}

export const CategoryCard = ({
  name,
  icon: Icon,
  count,
  description,
  gradient,
  onClick,
}: CategoryCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        onClick={onClick}
        className={`${gradient} cursor-pointer border-0 glass-interactive overflow-hidden group`}
      >
        <div className="p-6 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <p className="text-sm text-white/80 mb-3">{description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{count}</span>
              <span className="text-sm text-white/70">books</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
