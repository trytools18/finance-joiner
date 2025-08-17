import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VATStatsCards } from "../stats/VATStatsCards";

interface VATSectionProps {
  vatReceived: number;
  vatPaid: number;
  vatBalance: number;
  currencyCode: "USD" | "EUR" | "GBP";
}

export function VATSection({ vatReceived, vatPaid, vatBalance, currencyCode }: VATSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">VAT Overview</h2>
      </div>
      
      <VATStatsCards
        vatReceived={vatReceived}
        vatPaid={vatPaid}
        vatBalance={vatBalance}
        currencyCode={currencyCode}
      />
    </div>
  );
}