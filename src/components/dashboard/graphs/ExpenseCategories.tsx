
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

interface ExpenseCategoriesProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

export function ExpenseCategories({ 
  transactions, 
  currencyCode = "USD" 
}: ExpenseCategoriesProps) {
  const { categories } = useTransactionData();

  const chartData = useMemo(() => {
    // Filter completed expense transactions
    const expenseTransactions = transactions.filter(
      t => t.type === 'expense' && t.status === 'completed'
    );
    
    // Group by category and sum amounts
    const categorySums = expenseTransactions.reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized';
      
      // Calculate the correct expense amount
      let amount;
      if (transaction.vat_clearable) {
        amount = Number(transaction.amount || 0);
      } else {
        amount = transaction.total_amount !== undefined && transaction.total_amount !== null
          ? transaction.total_amount
          : transaction.amount + (transaction.vat_amount || 0);
      }
      
      if (!acc[categoryId]) {
        acc[categoryId] = { 
          id: categoryId,
          value: 0, 
        };
      }
      
      acc[categoryId].value += amount;
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
  const COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#6E59A5', '#7E69AB', '#9b87f5'];

  const formatValue = (value: number) => {
    return formatCurrency(value, currencyCode);
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
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
              No expense data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
