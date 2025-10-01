import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { BookOpen, Users, TrendingUp, Clock } from "lucide-react";

interface LibraryStatsProps {
  totalBooks: number;
  totalBorrowers: number;
  activeLoans: number;
  avgBorrowTime: number;
}

export const LibraryStats = ({
  totalBooks,
  totalBorrowers,
  activeLoans,
  avgBorrowTime,
}: LibraryStatsProps) => {
  const stats = [
    {
      icon: BookOpen,
      value: totalBooks,
      label: "Books Available",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Users,
      value: totalBorrowers,
      label: "Active Readers",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: TrendingUp,
      value: activeLoans,
      label: "Current Loans",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Clock,
      value: avgBorrowTime,
      label: "Avg. Days",
      color: "text-warning",
      bgColor: "bg-warning/10",
      suffix: "d",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          className="glass border-0 shadow-apple-md hover:shadow-apple-lg transition-all duration-300 animate-fade-in-up"
          style={{
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both'
          }}
        >
          <div className="p-4 sm:p-6">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3 sm:mb-4`}>
              <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              <AnimatedCounter end={stat.value} suffix={stat.suffix} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
