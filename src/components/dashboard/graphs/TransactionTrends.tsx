
import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceArea
} from "recharts";
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isSameWeek,
  isSameMonth
} from "date-fns";
import { Transaction } from "@/components/transactions/types";
import { formatCurrency } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  const [zoomArea, setZoomArea] = useState<{ start?: number; end?: number }>({});
  const [isZooming, setIsZooming] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const currentDateRange = customDateRange || dateRange;

  // Zoom functions
  const zoomIn = useCallback(() => {
    const periods: TimePeriod[] = ['yearly', 'monthly', 'weekly', 'daily'];
    const currentIndex = periods.indexOf(timePeriod);
    if (currentIndex > 0) {
      setTimePeriod(periods[currentIndex - 1]);
      // Adjust date range for more detailed view
      const now = new Date();
      const start = currentDateRange.start;
      const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (periods[currentIndex - 1] === 'daily' && daysDiff > 60) {
        setCustomDateRange({
          start: subDays(now, 30),
          end: now
        });
      } else if (periods[currentIndex - 1] === 'weekly' && daysDiff > 365) {
        setCustomDateRange({
          start: subMonths(now, 6),
          end: now
        });
      }
    }
  }, [timePeriod, currentDateRange]);

  const zoomOut = useCallback(() => {
    const periods: TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
    const currentIndex = periods.indexOf(timePeriod);
    if (currentIndex < periods.length - 1) {
      setTimePeriod(periods[currentIndex + 1]);
      // Expand date range for broader view
      const now = new Date();
      if (periods[currentIndex + 1] === 'yearly') {
        setCustomDateRange({
          start: subYears(now, 3),
          end: now
        });
      } else if (periods[currentIndex + 1] === 'monthly') {
        setCustomDateRange({
          start: subYears(now, 1),
          end: now
        });
      }
    }
  }, [timePeriod, currentDateRange]);

  const resetZoom = useCallback(() => {
    setTimePeriod('daily');
    setCustomDateRange(null);
    setZoomArea({});
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  // Generate chart data based on time period
  const chartData = useMemo(() => {
    const start = currentDateRange.start;
    const end = currentDateRange.end;
    
    let intervals: Date[] = [];
    let formatPattern = '';
    let compareFunction: (date1: Date, date2: Date) => boolean;
    
    switch (timePeriod) {
      case 'daily':
        intervals = eachDayOfInterval({ start, end });
        formatPattern = 'MMM dd';
        compareFunction = isSameDay;
        break;
      case 'weekly':
        intervals = eachWeekOfInterval({ start, end });
        formatPattern = 'MMM dd';
        compareFunction = isSameWeek;
        break;
      case 'monthly':
        intervals = eachMonthOfInterval({ start, end });
        formatPattern = 'MMM yyyy';
        compareFunction = isSameMonth;
        break;
      case 'yearly':
        const years = [];
        let currentYear = start.getFullYear();
        const endYear = end.getFullYear();
        while (currentYear <= endYear) {
          years.push(new Date(currentYear, 0, 1));
          currentYear++;
        }
        intervals = years;
        formatPattern = 'yyyy';
        compareFunction = (date1: Date, date2: Date) => date1.getFullYear() === date2.getFullYear();
        break;
    }
    
    return intervals.map(interval => {
      // Filter transactions for this interval
      const intervalTransactions = transactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return compareFunction(transactionDate, interval);
      });
      
      // Calculate totals
      const income = intervalTransactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const expenses = intervalTransactions
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
        date: format(interval, formatPattern),
        rawDate: interval,
        income,
        expenses,
        balance: income - expenses
      };
    });
  }, [transactions, currentDateRange, timePeriod]);

  const formatValue = (value: number) => {
    return formatCurrency(value, currencyCode).split('.')[0];
  };

  // Handle zoom area selection
  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      const dataIndex = chartData.findIndex(d => d.date === e.activeLabel);
      setZoomArea({ start: dataIndex });
      setIsZooming(true);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isZooming && e && e.activeLabel) {
      const dataIndex = chartData.findIndex(d => d.date === e.activeLabel);
      setZoomArea(prev => ({ ...prev, end: dataIndex }));
    }
  };

  const handleMouseUp = () => {
    if (isZooming && zoomArea.start !== undefined && zoomArea.end !== undefined) {
      const startIndex = Math.min(zoomArea.start, zoomArea.end);
      const endIndex = Math.max(zoomArea.start, zoomArea.end);
      
      if (startIndex !== endIndex) {
        const newStart = chartData[startIndex]?.rawDate;
        const newEnd = chartData[endIndex]?.rawDate;
        
        if (newStart && newEnd) {
          setCustomDateRange({ start: newStart, end: newEnd });
          // Auto-adjust time period based on range
          const daysDiff = Math.floor((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 30) {
            setTimePeriod('daily');
          } else if (daysDiff <= 180) {
            setTimePeriod('weekly');
          } else if (daysDiff <= 730) {
            setTimePeriod('monthly');
          } else {
            setTimePeriod('yearly');
          }
        }
      }
    }
    setIsZooming(false);
    setZoomArea({});
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Trends</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Period: {timePeriod}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={timePeriod === 'yearly'}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={timePeriod === 'daily'}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Drag to zoom • Ctrl/⌘ + scroll to change periods • Ctrl/⌘ + 0 to reset
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: isZooming ? 'crosshair' : 'default' }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatValue}
                className="text-muted-foreground"
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currencyCode), 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
                labelFormatter={(label) => `${timePeriod === 'yearly' ? 'Year' : 'Date'}: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              
              {/* Zoom area overlay */}
              {isZooming && zoomArea.start !== undefined && zoomArea.end !== undefined && (
                <ReferenceArea
                  x1={chartData[zoomArea.start]?.date}
                  x2={chartData[zoomArea.end]?.date}
                  strokeOpacity={0.3}
                  fillOpacity={0.1}
                  fill="hsl(var(--primary))"
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                activeDot={{ r: 6, fill: "hsl(var(--success))" }}
                dot={timePeriod === 'daily' && chartData.length > 60 ? false : { r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                activeDot={{ r: 6, fill: "hsl(var(--destructive))" }}
                dot={timePeriod === 'daily' && chartData.length > 60 ? false : { r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                dot={timePeriod === 'daily' && chartData.length > 60 ? false : { r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
