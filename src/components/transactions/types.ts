export type TransactionCategory = "income" | "expense" | "transfer";
export type PaymentMethod = "cash" | "card" | "online";
export type TransactionStatus = "completed" | "pending" | "cancelled";

export interface TransactionParty {
  id: string;
  name: string;
  type: string;
  company_name: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface NewTransactionDialogProps {
  defaultPaymentMethod?: PaymentMethod;
  defaultVatRate?: number;
  vatRates?: number[];
  defaultCurrency?: "USD" | "EUR" | "GBP";
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  transactionToEdit?: Transaction | null;
  onClose?: () => void;
  currencyCode?: "USD" | "EUR" | "GBP";
}

export interface TransactionFormData {
  date: string;
  type: TransactionCategory;
  category_id: string;
  amount: number;
  vat: number;
  vat_amount: number;
  vat_clearable: boolean;
  total_amount: number;
  party: string | null;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  user_id: string;
  description: string | null;
}

export interface Transaction {
  id: string;
  date: string;
  party: string | null;
  type: TransactionCategory;
  amount: number;
  vat?: number | null;
  vat_amount?: number;
  vat_clearable?: boolean;
  total_amount?: number;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  category_id?: string;
  description?: string | null;
}

export interface Column {
  id: string;
  label: string;
  render: (transaction: Transaction) => React.ReactNode;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export interface VATUpdateInput {
  id: string;
  vat_clearable: boolean;
  description?: string | null;
}

export interface SelectedTransactionsActions {
  edit?: boolean;
  delete?: boolean;
}
