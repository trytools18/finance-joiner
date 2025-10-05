
import { formatCurrency } from "@/lib/utils";
import { Column, Transaction } from "../types";
import { StatusCell } from "./StatusCell";
import { TransactionDetailsDialog } from "../TransactionDetailsDialog";
import { useState } from "react";
import { Repeat } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const createTableColumns = (
  getPartyName: (partyId: string | null) => string,
  getCategoryName: (transaction: Transaction) => string,
  onStatusChange: (id: string, status: Transaction['status']) => void,
  onVatClearableChange: (id: string, vatClearable: boolean) => void,
  currencyCode: "USD" | "EUR" | "GBP"
): Column[] => {
  const formatAmount = (transaction: Transaction) => {
    const netAmount = transaction.amount || 0;
    const vatAmount = transaction.vat_amount || 0;
    
    // Use the provided total_amount if available, otherwise calculate it
    const totalAmount = transaction.total_amount !== undefined && transaction.total_amount !== null
      ? transaction.total_amount
      : netAmount + vatAmount;
    
    const formattedAmount = formatCurrency(Math.abs(totalAmount), currencyCode);
    const sign = transaction.type === 'income' ? '+' : '-';
    const color = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={color}>
        {sign} {formattedAmount}
      </span>
    );
  };

  return [
    {
      id: 'date',
      label: 'Date',
      render: (transaction) => new Date(transaction.date).toLocaleDateString(),
    },
    {
      id: 'party',
      label: 'Party',
      render: (transaction) => getPartyName(transaction.party),
    },
    {
      id: 'category',
      label: 'Category',
      render: (transaction) => <span className="capitalize">{getCategoryName(transaction)}</span>,
    },
    {
      id: 'description',
      label: 'Description',
      render: (transaction) => (
        <div className="flex items-center gap-2 max-w-xs">
          <span className="truncate">
            {transaction.description || '-'}
          </span>
          {transaction.recurring_transaction_id && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Repeat className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recurring Transaction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      render: formatAmount,
    },
    {
      id: 'status',
      label: 'Status',
      render: (transaction) => (
        <StatusCell
          transaction={transaction}
          onStatusChange={onStatusChange}
        />
      ),
    },
    {
      id: 'payment_method',
      label: 'Payment Method',
      render: (transaction) => <span className="capitalize">{transaction.payment_method}</span>,
    },
  ];
};
