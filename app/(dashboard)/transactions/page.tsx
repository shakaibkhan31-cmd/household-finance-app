'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import { Search, Plus, ArrowUpRight, ArrowDownLeft, Trash2, Edit3, X, ArrowRightLeft, Calendar, Download, CheckSquare, Square, ChevronLeft, ChevronRight, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  type: string;
  account_name: string;
  transfer_to?: string;
  category: string;
  amount: number;
  party_name: string;
  description: string;
  entered_by?: string;
  created_at?: string;
  user_id?: string;
}

export interface Debt {
  id: string;
  person_name: string;
  direction: string;
  amount: number;
  type: string;
  user_id?: string;
}

const TRANSACTION_TYPES = [
  'Expense',
  'Income Receipt',
  'Transfer',
  'Loan Given',
  'Loan Received',
  'Loan Repayment',
  'Refund',
  'Adjustment',
  'Bill Payment'
];

const INCOME_CATEGORIES = [
  'Salary / Business Income',
  'Support / Gift',
  'Rental Income',
  'Investment Return',
  'Other Inflow'
];

const LOAN_CATEGORIES = [
  'Loan / Debt Related'
];

// Helper function to format date from YYYY-MM-DD to DD-MM-YYYY for display
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [activeDebts, setActiveDebts] = useState<Debt[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentMonthPrefix, setCurrentMonthPrefix] = useState<string>('');
  const [currency, setCurrency] = useState('PKR');
  const [memberName, setMemberName] = useState('Member');

  // Custom Category State for Expense
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<string>('Expense');
  const [accountName, setAccountName] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'add' | 'subtract'>('add');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mobile Expanded Details State
  const [expandedMobileIds, setExpandedMobileIds] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDueDate(today);
    setCurrentMonthPrefix(today.slice(0, 7));
    fetchDataAndSync();
  }, []);

  const fetchDataAndSync = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_currency, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.preferred_currency) {
      setCurrency(profile.preferred_currency);
    }

    let computedName = user.email ? user.email.split('@')[0] : 'Member';
    
    if (profile && profile.full_name) {
      computedName = profile.full_name;
    } else {
      const { data: familyMemberMatch } = await supabase
        .from('family_members')
        .select('member_name')
        .eq('member_email', user.email?.toLowerCase() || '')
        .maybeSingle();

      if (familyMemberMatch && familyMemberMatch.member_name) {
        computedName = familyMemberMatch.member_name;
      }
    }
    setMemberName(computedName);

    const { data: accData, error: accError } = await supabase
      .from('accounts')
      .select('name')
      .eq('user_id', user.id);

    if (accError) {
      console.error('Error fetching accounts:', accError.message);
    } else if (accData && accData.length > 0) {
      const fetchedAccountNames = accData.map((a: { name: string }) => a.name);
      setAvailableAccounts(fetchedAccountNames);
      
      const firstAcc = fetchedAccountNames[0];
      if (!accountName) setAccountName(firstAcc);
      
      if (!transferTo) {
        const differentAcc = fetchedAccountNames.find(acc => acc !== (accountName || firstAcc));
        setTransferTo(differentAcc || firstAcc);
      }
    } else {
      setAvailableAccounts([]);
      setAccountName('');
      setTransferTo('');
    }

    const { data: bData } = await supabase
      .from('budgets')
      .select('category')
      .eq('user_id', user.id);

    let fetchedBudgetCats: string[] = [];
    if (bData && bData.length > 0) {
      fetchedBudgetCats = bData.map((b: { category: string }) => b.category).filter(Boolean);
    }
    setBudgetCategories(fetchedBudgetCats);
    
    if (!category && type === 'Expense' && fetchedBudgetCats.length > 0) {
      setCategory(fetchedBudgetCats[0]);
    }

    const { data: debtsData } = await supabase
      .from('debts')
      .select('id, person_name, direction, amount, type')
      .eq('user_id', user.id)
      .eq('status', 'Active');

    if (debtsData && debtsData.length > 0) {
      setActiveDebts(debtsData);
      if (!selectedDebtId) setSelectedDebtId(debtsData[0].id);
    } else {
      setActiveDebts([]);
      setSelectedDebtId('');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const getCategoriesForType = (currentType: string) => {
    switch (currentType) {
      case 'Income Receipt':
        return INCOME_CATEGORIES;
      case 'Loan Given':
      case 'Loan Received':
      case 'Loan Repayment':
        return LOAN_CATEGORIES;
      case 'Transfer':
        return ['Internal Transfer'];
      case 'Adjustment':
        return ['Account Adjustment'];
      case 'Expense':
      case 'Bill Payment':
      case 'Refund':
      default:
        return budgetCategories;
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setIsCustomCategory(false);
    setCustomCategoryInput('');

    const availableCats = getCategoriesForType(newType);
    if (availableCats.length > 0) {
      setCategory(availableCats[0]);
    } else {
      setCategory('');
    }

    if (newType === 'Transfer' && transferTo === accountName) {
      const diff = availableAccounts.find(acc => acc !== accountName);
      if (diff) setTransferTo(diff);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!amount || !accountName) {
      alert('Please select an account and enter an amount.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryInput.trim() : category;
    if (!finalCategory && !['Transfer'].includes(type)) {
      alert('Please select or enter a valid category.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('User not authenticated!');
      return;
    }

    const parsedAmount = parseFloat(amount);
    const isTransfer = type === 'Transfer';
    const isRepayment = type === 'Loan Repayment';
    const isAdjustment = type === 'Adjustment';

    if (isTransfer && accountName === transferTo) {
      alert('Source and Destination accounts cannot be the same for a transfer.');
      return;
    }

    if (isRepayment && selectedDebtId) {
      const targetDebt = activeDebts.find(d => d.id === selectedDebtId);
      if (targetDebt) {
        const debtMaxAmount = Number(targetDebt.amount);
        if (parsedAmount > debtMaxAmount) {
          alert(`Repayment amount cannot be greater than the outstanding loan balance of ${formatCurrency(debtMaxAmount, currency)}.`);
          return;
        }
      }
    }

    let finalPartyName = partyName;
    if (isRepayment && selectedDebtId) {
      const matchedDebt = activeDebts.find(d => d.id === selectedDebtId);
      if (matchedDebt) {
        finalPartyName = matchedDebt.person_name;
      }
    } else if (isAdjustment) {
      finalPartyName = partyName || `Balance Adjustment (${adjustmentDirection === 'add' ? 'Increase' : 'Decrease'})`;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('transactions')
          .update({
            date,
            type,
            account_name: accountName,
            transfer_to: isTransfer ? transferTo : null,
            category: isTransfer ? 'Internal Transfer' : finalCategory,
            amount: parsedAmount,
            party_name: isTransfer ? 'Self Transfer' : finalPartyName,
            description,
          })
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (error) {
          alert('Error updating transaction: ' + error.message);
          setIsSubmitting(false);
          return;
        }
        setEditingId(null);
      } else {
        const { error } = await supabase.from('transactions').insert([
          {
            date,
            type,
            account_name: accountName,
            transfer_to: isTransfer ? transferTo : null,
            category: isTransfer ? 'Internal Transfer' : finalCategory,
            amount: parsedAmount,
            party_name: isTransfer ? 'Self Transfer' : finalPartyName,
            description,
            entered_by: memberName,
            user_id: user.id,
          },
        ]);

        if (error) {
          alert('Error recording transaction: ' + error.message);
          setIsSubmitting(false);
          return;
        }

        if (isTransfer) {
          // Source Account deduction
          const { data: srcAcc } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountName)
            .eq('user_id', user.id)
            .limit(1);

          if (srcAcc && srcAcc.length > 0) {
            const accObj = srcAcc[0];
            const isSrcCard = (accObj.type || '').trim().toLowerCase().includes('credit');
            let currentBal = Number(accObj.current_balance || 0);
            
            if (isSrcCard) {
              currentBal += parsedAmount; 
            } else {
              currentBal -= parsedAmount; 
            }

            await supabase
              .from('accounts')
              .update({ current_balance: currentBal })
              .eq('id', accObj.id)
              .eq('user_id', user.id);
          }

          // Destination Account addition/credit card payment reduction
          const { data: destAcc } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', transferTo)
            .eq('user_id', user.id)
            .limit(1);

          if (destAcc && destAcc.length > 0) {
            const accObj = destAcc[0];
            const isDestCard = (accObj.type || '').trim().toLowerCase().includes('credit');
            let currentBal = Number(accObj.current_balance || 0);

            if (isDestCard) {
              currentBal -= parsedAmount; // Payment to credit card reduces outstanding
            } else {
              currentBal += parsedAmount;
            }

            await supabase
              .from('accounts')
              .update({ current_balance: currentBal })
              .eq('id', accObj.id)
              .eq('user_id', user.id);
          }
        } else {
          const { data: accList } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', accountName)
            .eq('user_id', user.id)
            .limit(1);

          if (accList && accList.length > 0) {
            const acc = accList[0];
            const isCardType = (acc.type || '').trim().toLowerCase().includes('credit');
            let currentBal = Number(acc.current_balance || 0);
            
            const isCreditInflow = ['Income Receipt', 'Loan Received', 'Refund'].includes(type);
            let effectiveIsCredit = isCreditInflow;

            if (isAdjustment) {
              effectiveIsCredit = adjustmentDirection === 'add';
            }

            if (isCardType) {
              if (effectiveIsCredit) {
                currentBal -= parsedAmount; 
              } else {
                currentBal += parsedAmount; 
              }
            } else {
              if (effectiveIsCredit) {
                currentBal += parsedAmount;
              } else {
                currentBal -= parsedAmount;
              }
            }

            await supabase
              .from('accounts')
              .update({ current_balance: currentBal })
              .eq('id', acc.id)
              .eq('user_id', user.id);
          }
        }

        if (type === 'Loan Given') {
          await supabase.from('debts').insert([
            {
              person_name: partyName || 'Unknown Party',
              type: 'Personal Loan',
              direction: 'Given (Receivable)',
              amount: parsedAmount,
              due_date: dueDate || date,
              status: 'Active',
              notes: description || `Loan Given via ${accountName}`,
              user_id: user.id,
            },
          ]);
        } else if (type === 'Loan Received') {
          await supabase.from('debts').insert([
            {
              person_name: partyName || 'Unknown Party',
              type: 'Personal Loan',
              direction: 'Taken (Payable)',
              amount: parsedAmount,
              due_date: dueDate || date,
              status: 'Active',
              notes: description || `Loan Received in ${accountName}`,
              user_id: user.id,
            },
          ]);
        } else if (type === 'Loan Repayment' && selectedDebtId) {
          const targetDebt = activeDebts.find(d => d.id === selectedDebtId);
          if (targetDebt) {
            const updatedAmount = Math.max(0, Number(targetDebt.amount) - parsedAmount);
            await supabase
              .from('debts')
              .update({ 
                amount: updatedAmount,
                status: updatedAmount === 0 ? 'Settled' : 'Active'
              })
              .eq('id', targetDebt.id)
              .eq('user_id', user.id);
          }
        }
      }

      resetForm();
      await fetchDataAndSync();
    } catch (err: any) {
      alert('Transaction error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setDate(t.date);
    setType(t.type);
    setAccountName(t.account_name);
    setTransferTo(t.transfer_to || availableAccounts.find(acc => acc !== t.account_name) || availableAccounts[0]);
    
    if (budgetCategories.includes(t.category) || ['Income Receipt', 'Loan Given', 'Loan Received', 'Loan Repayment'].includes(t.type)) {
      setIsCustomCategory(false);
      setCategory(t.category);
    } else {
      setIsCustomCategory(true);
      setCustomCategoryInput(t.category);
    }

    setAmount(t.amount.toString());
    setPartyName(t.party_name || '');
    setDescription(t.description || '');
  };

  const handleDeleteTransaction = async (t: Transaction) => {
    if (!confirm('Kya aap waqai is transaction ko delete karna chahte hain? Account balance wapas adjust ho jayega.')) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const txAmount = Number(t.amount);
    const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
    const isTransfer = t.type === 'Transfer';

    if (isTransfer && t.transfer_to) {
      const { data: srcAcc } = await supabase
        .from('accounts')
        .select('*')
        .eq('name', t.account_name)
        .eq('user_id', user.id)
        .limit(1);

      if (srcAcc && srcAcc.length > 0) {
        const isSrcCard = (srcAcc[0].type || '').trim().toLowerCase().includes('credit');
        let bal = Number(srcAcc[0].current_balance || 0);
        if (isSrcCard) bal -= txAmount;
        else bal += txAmount;

        await supabase
          .from('accounts')
          .update({ current_balance: bal })
          .eq('id', srcAcc[0].id)
          .eq('user_id', user.id);
      }
      const { data: destAcc } = await supabase
        .from('accounts')
        .select('*')
        .eq('name', t.transfer_to)
        .eq('user_id', user.id)
        .limit(1);

      if (destAcc && destAcc.length > 0) {
        const isDestCard = (destAcc[0].type || '').trim().toLowerCase().includes('credit');
        let bal = Number(destAcc[0].current_balance || 0);
        if (isDestCard) bal += txAmount;
        else bal -= txAmount;

        await supabase
          .from('accounts')
          .update({ current_balance: bal })
          .eq('id', destAcc[0].id)
          .eq('user_id', user.id);
      }
    } else {
      const { data: accList } = await supabase
        .from('accounts')
        .select('*')
        .eq('name', t.account_name)
        .eq('user_id', user.id)
        .limit(1);

      if (accList && accList.length > 0) {
        const acc = accList[0];
        const isCard = (acc.type || '').trim().toLowerCase().includes('credit');
        let currentBal = Number(acc.current_balance || 0);

        if (isCard) {
          if (isCredit) currentBal += txAmount;
          else currentBal -= txAmount;
        } else {
          if (isCredit) currentBal -= txAmount;
          else currentBal += txAmount;
        }

        await supabase
          .from('accounts')
          .update({ current_balance: currentBal })
          .eq('id', acc.id)
          .eq('user_id', user.id);
      }
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', t.id)
      .eq('user_id', user.id);

    if (error) {
      alert('Error deleting transaction: ' + error.message);
    } else {
      fetchDataAndSync();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Kya aap waqai selected ${selectedIds.length} transactions ko delete karna chahte hain?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const id of selectedIds) {
      const t = transactions.find(item => item.id === id);
      if (t) {
        const txAmount = Number(t.amount);
        const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
        const isTransfer = t.type === 'Transfer';

        if (isTransfer && t.transfer_to) {
          const { data: srcAcc } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', t.account_name)
            .eq('user_id', user.id)
            .limit(1);

          if (srcAcc && srcAcc.length > 0) {
            const isSrcCard = (srcAcc[0].type || '').trim().toLowerCase().includes('credit');
            let bal = Number(srcAcc[0].current_balance || 0);
            if (isSrcCard) bal -= txAmount;
            else bal += txAmount;

            await supabase
              .from('accounts')
              .update({ current_balance: bal })
              .eq('id', srcAcc[0].id)
              .eq('user_id', user.id);
          }
          const { data: destAcc } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', t.transfer_to)
            .eq('user_id', user.id)
            .limit(1);

          if (destAcc && destAcc.length > 0) {
            const isDestCard = (destAcc[0].type || '').trim().toLowerCase().includes('credit');
            let bal = Number(destAcc[0].current_balance || 0);
            if (isDestCard) bal += txAmount;
            else bal -= txAmount;

            await supabase
              .from('accounts')
              .update({ current_balance: bal })
              .eq('id', destAcc[0].id)
              .eq('user_id', user.id);
          }
        } else {
          const { data: accList } = await supabase
            .from('accounts')
            .select('*')
            .eq('name', t.account_name)
            .eq('user_id', user.id)
            .limit(1);

          if (accList && accList.length > 0) {
            const acc = accList[0];
            const isCard = (acc.type || '').trim().toLowerCase().includes('credit');
            let currentBal = Number(acc.current_balance || 0);

            if (isCard) {
              if (isCredit) currentBal += txAmount;
              else currentBal -= txAmount;
            } else {
              if (isCredit) currentBal -= txAmount;
              else currentBal += txAmount;
            }

            await supabase
              .from('accounts')
              .update({ current_balance: currentBal })
              .eq('id', acc.id)
              .eq('user_id', user.id);
          }
        }
      }
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', selectedIds)
      .eq('user_id', user.id);

    if (error) {
      alert('Error performing bulk delete: ' + error.message);
    } else {
      setSelectedIds([]);
      fetchDataAndSync();
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Party Name', 'Account', 'Transfer To', `Amount (${currency})`, 'Entered By', 'Description'];
    const rows = filteredTransactions.map(t => [
      formatDateDisplay(t.date),
      t.type,
      t.category,
      `"${t.party_name || ''}"`,
      t.account_name,
      t.transfer_to || '',
      t.amount,
      t.entered_by || 'System',
      `"${t.description || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setPartyName('');
    setDescription('');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDueDate(today);
  };

  const toggleMobileExpand = (id: string) => {
    setExpandedMobileIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isTransferType = type === 'Transfer';
  const isLoanType = type === 'Loan Given' || type === 'Loan Received';
  const isRepaymentType = type === 'Loan Repayment';
  const isRefundType = type === 'Refund';
  const isAdjustmentType = type === 'Adjustment';
  const showCustomCategoryOption = ['Expense', 'Bill Payment', 'Refund'].includes(type);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transfer_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entered_by?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesAccount = selectedAccount === 'All' || t.account_name === selectedAccount || t.transfer_to === selectedAccount;
    const matchesType = selectedType === 'All' || t.type === selectedType;

    const txDate = t.date;
    const matchesFromDate = !fromDate || txDate >= fromDate;
    const matchesToDate = !toDate || txDate <= toDate;

    return matchesSearch && matchesCategory && matchesAccount && matchesType && matchesFromDate && matchesToDate;
  });

  const monthlyExpenses = currentMonthPrefix
    ? transactions
        .filter((t) => t.date && t.date.startsWith(currentMonthPrefix) && (t.type === 'Expense' || t.type === 'Bill Payment'))
        .reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  const monthlyIncome = currentMonthPrefix
    ? transactions
        .filter((t) => t.date && t.date.startsWith(currentMonthPrefix) && (t.type === 'Income Receipt'))
        .reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map(t => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const currentCategoriesList = getCategoriesForType(type);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions Ledger</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed records, transfers, and family member logs</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl flex-1 md:w-44">
            <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider">This Month Expense</p>
            <p className="text-lg font-bold text-rose-950 dark:text-rose-200 mt-0.5">{formatCurrency(monthlyExpenses, currency)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3.5 rounded-2xl flex-1 md:w-44">
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">This Month Income</p>
            <p className="text-lg font-bold text-emerald-950 dark:text-emerald-200 mt-0.5">{formatCurrency(monthlyIncome, currency)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {editingId ? 'Edit Transaction' : 'New Ledger Entry'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 hover:underline">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          {availableAccounts.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <p className="font-semibold">No Accounts Found!</p>
              <p>Please go to the <strong>Accounts</strong> page from the sidebar and add your first bank account or wallet before recording transactions.</p>
            </div>
          ) : (
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Date (DD-MM-YYYY)</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Transaction Type</label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isAdjustmentType && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300">Adjustment Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentDirection('add')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                        adjustmentDirection === 'add'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      + Add Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentDirection('subtract')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                        adjustmentDirection === 'subtract'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      - Deduct Balance
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isTransferType ? 'From Account (Source)' : isRefundType ? 'Refund Deposited In' : 'Account'}
                </label>
                <select
                  value={accountName}
                  onChange={(e) => {
                    const newAcc = e.target.value;
                    setAccountName(newAcc);
                    if (newAcc === transferTo) {
                      const diff = availableAccounts.find(acc => acc !== newAcc);
                      if (diff) setTransferTo(diff);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              {isTransferType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Transfer To (Destination)</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    {availableAccounts
                      .filter((acc) => acc !== accountName)
                      .map((acc) => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                  </select>
                </div>
              )}

              {isRepaymentType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select Loan to Repay</label>
                  {activeDebts.length === 0 ? (
                    <p className="text-xs text-rose-500 dark:text-rose-400 font-medium p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg">No active loan records found in Debts & Kameti.</p>
                  ) : (
                    <select
                      value={selectedDebtId}
                      onChange={(e) => setSelectedDebtId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-amber-900 dark:text-amber-200"
                    >
                      {activeDebts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.person_name} ({d.direction}) - {formatCurrency(Number(d.amount), currency)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className={`grid ${isTransferType ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                {!isTransferType && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {isRefundType ? 'Expense Category to Offset' : 'Category (Synced)'}
                    </label>

                    {showCustomCategoryOption && isCustomCategory ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Enter new category name..."
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => { setIsCustomCategory(false); setCustomCategoryInput(''); }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline block"
                        >
                          ← Select from existing budget categories
                        </button>
                      </div>
                    ) : (
                      <select
                        value={category}
                        onChange={(e) => {
                          if (e.target.value === '__add_custom__') {
                            setIsCustomCategory(true);
                            setCategory('');
                          } else {
                            setCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      >
                        {currentCategoriesList.length === 0 ? (
                          <option value="">No budget categories found</option>
                        ) : (
                          currentCategoriesList.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        )}
                        {showCustomCategoryOption && (
                          <option value="__add_custom__" className="font-bold text-indigo-600 dark:text-indigo-400">
                            + Add Custom Category...
                          </option>
                        )}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ({currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              {!isTransferType && !isRepaymentType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isRefundType
                      ? 'Refunded By (Store / Merchant / Person)'
                      : isAdjustmentType
                      ? 'Adjustment Reason / Reference'
                      : 'Paid to / Received From'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isRefundType
                        ? 'e.g. Imtiaz Super Market / Daraz'
                        : isAdjustmentType
                        ? 'e.g. Missing Cash Reconcile / ATM Mismatch'
                        : 'e.g. Imtiaz Super Market / Electric Co'
                    }
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {isLoanType && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Loan Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description / Remarks</label>
                <input
                  type="text"
                  placeholder={
                    isRefundType
                      ? 'e.g. Returned defective item / Order cancellation'
                      : isAdjustmentType
                      ? 'e.g. Audited cash drawer mismatch'
                      : 'e.g. Monthly Grocery items'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-xl text-xs transition shadow-sm mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  editingId ? 'Update Transaction' : 'Record Transaction'
                )}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by party, note, category, account, member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {budgetCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-medium text-[11px] text-slate-500 dark:text-slate-400">Date Range:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-medium ml-auto cursor-pointer"
                >
                  Clear Dates
                </button>
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-2.5 rounded-xl text-xs">
                <span className="font-semibold text-indigo-900 dark:text-indigo-300">{selectedIds.length} transaction(s) selected</span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition cursor-pointer"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* DESKTOP VIEW: Spreadsheet-Style Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="cursor-pointer">
                        {selectedIds.length > 0 && selectedIds.length === paginatedTransactions.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Date (DD-MM-YYYY)</th>
                    <th className="py-3 px-4">Type & Category</th>
                    <th className="py-3 px-4">Party / Note</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4 text-right">Amount / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">Loading transactions...</td>
                    </tr>
                  ) : paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">No transactions match your query.</td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t) => {
                      const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
                      const isTransferRow = t.type === 'Transfer';
                      const isSelected = selectedIds.includes(t.id);

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''}`}>
                          <td className="py-3.5 px-3 text-center">
                            <button onClick={() => toggleSelectOne(t.id)} className="cursor-pointer">
                              {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-4 h-4 text-slate-400" />}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{formatDateDisplay(t.date)}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 dark:text-white text-[11px] block">{t.type}</span>
                            <span className="inline-block mt-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                              {t.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-indigo-900 dark:text-indigo-300">{t.party_name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.description || '-'}</p>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <User className="w-3 h-3 text-indigo-500" />
                              <span>{t.entered_by || memberName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {isTransferRow ? (
                              <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg w-fit">
                                <span>{t.account_name}</span>
                                <ArrowRightLeft className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>{t.transfer_to}</span>
                              </div>
                            ) : (
                              <span className="font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                {t.account_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className={`font-bold flex items-center justify-end gap-1 text-sm ${
                              isCredit ? 'text-emerald-600 dark:text-emerald-400' : isTransferRow ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {!isTransferRow && (
                                isCredit ? (
                                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-rose-500" />
                                )
                              )}
                              {formatCurrency(Number(t.amount), currency)}
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-1.5">
                              <button
                                onClick={() => handleEditClick(t)}
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t)}
                                className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-800 font-medium flex items-center gap-0.5 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: Card-Based Layout with Tap-to-Expand Details */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading transactions...</div>
              ) : paginatedTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No transactions match your query.</div>
              ) : (
                paginatedTransactions.map((t) => {
                  const isCredit = ['Income Receipt', 'Loan Received', 'Refund'].includes(t.type);
                  const isTransferRow = t.type === 'Transfer';
                  const isExpanded = expandedMobileIds.includes(t.id);
                  const isSelected = selectedIds.includes(t.id);

                  return (
                    <div key={t.id} className={`p-4 space-y-3 transition ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : 'bg-white dark:bg-slate-900'}`}>
                      
                      {/* Top Row: Checkbox, Date & Amount */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <button onClick={() => toggleSelectOne(t.id)} className="cursor-pointer">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                          </button>
                          <span className="text-[11px] font-mono text-slate-400">{formatDateDisplay(t.date)}</span>
                        </div>
                        <div className={`text-base font-bold flex items-center gap-1 ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : isTransferRow ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {!isTransferRow && (
                            isCredit ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-rose-500" />
                          )}
                          {formatCurrency(Number(t.amount), currency)}
                        </div>
                      </div>

                      {/* Middle Row: Type, Category & Account */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block">{t.type}</span>
                          <span className="inline-block mt-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                            {t.category || 'General'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            {t.account_name} {isTransferRow && t.transfer_to ? `➔ ${t.transfer_to}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Tap to Expand / Collapse Detailed Information */}
                      <div>
                        <button
                          onClick={() => toggleMobileExpand(t.id)}
                          className="w-full pt-1.5 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'Tap for Detailed Information'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs border border-slate-100 dark:border-slate-800 animate-in fade-in">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Party / Merchant:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{t.party_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Description / Note:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{t.description || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Recorded By:</span>
                              <span className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                <User className="w-3 h-3" /> {t.entered_by || memberName}
                              </span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              <button
                                onClick={() => handleEditClick(t)}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t)}
                                className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}