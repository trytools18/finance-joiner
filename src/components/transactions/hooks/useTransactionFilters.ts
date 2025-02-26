
import { useState, useMemo } from 'react';
import { Transaction, TransactionCategory } from '../types';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';

export const useTransactionFilters = (transactions: Transaction[]) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [transactionType, setTransactionType] = useState<TransactionCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => {
        return (
          transaction.description?.toLowerCase().includes(search) ||
          transaction.payment_method.toLowerCase().includes(search) ||
          transaction.type.toLowerCase().includes(search)
        );
      });
    }

    // Filter by date range
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter(transaction => {
        const transactionDate = parseISO(transaction.date);
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(transactionDate, {
            start: dateRange.from,
            end: dateRange.to
          });
        }
        if (dateRange.from) {
          return transactionDate >= dateRange.from;
        }
        if (dateRange.to) {
          return transactionDate <= dateRange.to;
        }
        return true;
      });
    }

    // Filter by transaction type
    if (transactionType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === transactionType);
    }

    return filtered;
  }, [transactions, dateRange, transactionType, searchTerm]);

  const hasActiveFilters = !!(dateRange?.from || dateRange?.to || transactionType !== 'all' || searchTerm);

  const clearFilters = () => {
    setDateRange(undefined);
    setTransactionType('all');
    setSearchTerm('');
  };

  return {
    filteredTransactions,
    dateRange,
    setDateRange,
    transactionType,
    setTransactionType,
    searchTerm,
    setSearchTerm,
    clearFilters,
    hasActiveFilters
  };
};
