
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from "recharts";
import { Transaction } from "@/components/transactions/types";
import { formatCurrency } from "@/lib/utils";
import { useTransactionData } from "@/components/transactions/hooks/useTransactionData";

interface IncomeCategoriesProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

export function IncomeCategories({ 
  transactions, 
  currencyCode = "USD" 
}: IncomeCategoriesProps) {
  const { categories } = useTransactionData();

  const chartData = useMemo(() => {
    // Filter completed income transactions
    const incomeTransactions = transactions.filter(
      t => t.type === 'income' && t.status === 'completed'
    );
    
    // Group by category and sum amounts
    const categorySums = incomeTransactions.reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized';
      
      if (!acc[categoryId]) {
        acc[categoryId] = { 
          id: categoryId,
          value: 0, 
        };
      }
      
      acc[categoryId].value += Number(transaction.amount || 0);
      return acc;
    }, {} as Record<string, { id: string; value: number }>);
    
    // Convert to array and add category names
    return Object.values(categorySums).map(item => {
      const category = categories.find(c => c.id === item.id);
      return {
        ...item,
        name: category ? category.name : 'Uncategorized',
      };
    }).sort((a, b) => b.value - a.value); // Sort by value descending
  }, [transactions, categories]);

  // Color palette
  const COLORS = ['#9b87f5', '#0FA0CE', '#33C3F0', '#1EAEDB', '#7E69AB', '#6E59A5', '#8B5CF6'];

  const formatValue = (value: number) => {
    return formatCurrency(value, currencyCode);
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Income Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatValue(value), 'Amount']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No income data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
