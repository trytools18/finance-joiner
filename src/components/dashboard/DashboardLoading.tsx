
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/skeleton";
import { CreditCard, TrendingUp, BarChart3, Wallet } from "lucide-react";

export const DashboardLoading = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Skeleton className="w-36 h-10" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
      
      {/* Stat Cards Loading */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCardSkeleton icon={TrendingUp} title="Income" />
        <StatCardSkeleton icon={BarChart3} title="Expenses" />
        <StatCardSkeleton icon={Wallet} title="Balance" />
      </div>

      {/* VAT Statistics Loading */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCardSkeleton icon={CreditCard} title="VAT Received" />
        <StatCardSkeleton icon={CreditCard} title="VAT Paid" />
        <StatCardSkeleton icon={CreditCard} title="VAT Balance" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Transactions</h2>
          <Skeleton className="w-10 h-10" />
        </div>
        <TableSkeleton rowCount={5} />
      </div>
    </div>
  );
};

interface StatCardSkeletonProps {
  icon: React.ComponentType<any>;
  title: string;
}

const StatCardSkeleton = ({ icon: Icon, title }: StatCardSkeletonProps) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div className="flex items-center p-6">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Skeleton className="h-8 w-32 mt-1" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
      </div>
    </div>
  </div>
);
