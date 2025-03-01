
import { formatCurrency } from "@/lib/utils";
import { Column, Transaction } from "../types";
import { StatusCell } from "./StatusCell";
import { TransactionDetailsDialog } from "../TransactionDetailsDialog";
import { useState } from "react";

export const createTableColumns = (
  getPartyName: (partyId: string | null) => string,
  getCategoryName: (transaction: Transaction) => string,
  onStatusChange: (id: string, status: Transaction['status']) => void,
  onVatClearableChange: (id: string, vatClearable: boolean) => void,
  currencyCode: "USD" | "EUR" | "GBP"
): Column[] => {
  const formatAmount = (transaction: Transaction) => {
    // Use the total_amount directly if available
    const totalAmount = transaction.total_amount !== undefined && transaction.total_amount !== null
      ? Math.abs(transaction.total_amount)
      : Math.abs(transaction.amount || 0) + Math.abs(transaction.vat_amount || 0);
    
    console.log(`Transaction ${transaction.id}: Total: ${totalAmount}`);
    
    const formattedAmount = formatCurrency(totalAmount, currencyCode);
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
        <span className="max-w-xs truncate">
          {transaction.description || '-'}
        </span>
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
