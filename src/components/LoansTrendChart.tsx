import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface LoansTrendChartProps {
  data: Array<{
    month: string;
    loans: number;
    returns: number;
  }>;
}

export const LoansTrendChart = ({ data }: LoansTrendChartProps) => {
  const chartConfig = {
    loans: {
      label: "Loans",
      color: "hsl(var(--primary))",
    },
    returns: {
      label: "Returns",
      color: "hsl(var(--success))",
    },
  };

  return (
    <Card className="glass border-0 shadow-apple-lg">
      <CardHeader>
        <CardTitle>Loan Activity Trends</CardTitle>
        <CardDescription>Monthly loan and return statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
            <defs>
              <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="loans"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorLoans)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="returns"
              stroke="hsl(var(--success))"
              fillOpacity={1}
              fill="url(#colorReturns)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
