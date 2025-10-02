import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

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
          <BarChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
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
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar
              dataKey="loans"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
              name="Loans"
            />
            <Bar
              dataKey="returns"
              fill="hsl(var(--success))"
              radius={[8, 8, 0, 0]}
              name="Returns"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
