import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import {
  Users,
  UserCheck,
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['account-summary'],
    queryFn: () => accountsApi.getSummary().then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const summary = data!;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Overview of your business metrics</p>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totals.totalIncomeNrs)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totals.totalExpenseNrs)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className={`h-8 w-8 ${summary.totals.netNrs >= 0 ? 'text-success-600' : 'text-error-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className={`text-2xl font-bold ${summary.totals.netNrs >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(summary.totals.netNrs)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <p className="text-xl font-bold text-gray-900">{summary.counts.activeClients}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Staff</p>
              <p className="text-xl font-bold text-gray-900">{summary.counts.activeStaff}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Open Contracts</p>
              <p className="text-xl font-bold text-gray-900">{summary.counts.openContracts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-xl font-bold text-gray-900">{summary.counts.contractsExpiringIn7Days}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income by Client */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Client</h3>
          <div className="space-y-3">
            {summary.incomeByClient.map((item) => (
              <div key={item.clientId} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
            {summary.incomeByClient.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No income data available</p>
            )}
          </div>
        </div>

        {/* Expense by Source */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Source</h3>
          <div className="space-y-3">
            {summary.expenseBySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {item.source.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
            {summary.expenseBySource.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No expense data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Contract Expiry Alerts */}
      {(summary.counts.contractsExpiringIn1Day > 0 || 
        summary.counts.contractsExpiringIn7Days > 0 || 
        summary.counts.contractsExpiringIn30Days > 0) && (
        <div className="card border-warning-200 bg-warning-50">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-warning-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-warning-800">Contract Expiry Alerts</h3>
              <div className="mt-2 space-y-1 text-sm text-warning-700">
                {summary.counts.contractsExpiringIn1Day > 0 && (
                  <p>{summary.counts.contractsExpiringIn1Day} contract(s) expiring in 1 day</p>
                )}
                {summary.counts.contractsExpiringIn7Days > 0 && (
                  <p>{summary.counts.contractsExpiringIn7Days} contract(s) expiring in 7 days</p>
                )}
                {summary.counts.contractsExpiringIn30Days > 0 && (
                  <p>{summary.counts.contractsExpiringIn30Days} contract(s) expiring in 30 days</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}