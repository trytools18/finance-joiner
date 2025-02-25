
import { formatCurrency } from "@/lib/utils";
import { Column, Transaction, TransactionParty, Category } from "../types";
import { StatusCell } from "./StatusCell";

export const createTableColumns = (
  getPartyName: (partyId: string | null) => string,
  getCategoryName: (transaction: Transaction) => string,
  onStatusChange: (id: string, status: Transaction['status']) => void,
  currencyCode: "USD" | "EUR" | "GBP"
): Column[] => {
  const formatAmount = (transaction: Transaction) => {
    const amount = Math.abs(transaction.amount);
    const formattedAmount = formatCurrency(amount, currencyCode);
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
      render: (transaction) => <span className="max-w-xs truncate">{transaction.description || '-'}</span>,
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

