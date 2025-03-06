
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Transaction } from "@/components/transactions/types";
import { formatCurrency } from "@/lib/utils";

interface TransactionTrendsProps {
  transactions: Transaction[];
  dateRange: { start: Date; end: Date };
  currencyCode?: "USD" | "EUR" | "GBP";
}

export function TransactionTrends({ 
  transactions, 
  dateRange,
  currencyCode = "USD" 
}: TransactionTrendsProps) {
  const chartData = useMemo(() => {
    // Use the provided date range or default to current month
    const start = dateRange?.start || startOfMonth(new Date());
    const end = dateRange?.end || endOfMonth(new Date());
    
    // Generate an array of dates in the range
    const days = eachDayOfInterval({ start, end });
    
    // Create data points for each day
    return days.map(day => {
      // Filter transactions for this day
      const dayTransactions = transactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return isSameDay(transactionDate, day);
      });
      
      // Calculate total income and expenses for the day
      const income = dayTransactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const expenses = dayTransactions
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => {
          if (t.vat_clearable) {
            return sum + Number(t.amount || 0);
          } else {
            const amount = t.total_amount !== undefined && t.total_amount !== null
              ? t.total_amount
              : t.amount + (t.vat_amount || 0);
            return sum + Number(amount);
          }
        }, 0);
      
      return {
        date: format(day, 'MMM dd'),
        rawDate: day,
        income,
        expenses,
        balance: income - expenses
      };
    });
  }, [transactions, dateRange]);

  const formatValue = (value: number) => {
    return formatCurrency(value, currencyCode).split('.')[0]; // Remove cents for cleaner display
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Transaction Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatValue}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value, currencyCode), '']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#F97316" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#0EA5E9" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
