import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, staffApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Calculator, Download } from 'lucide-react';

export function Accounts() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>();

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['account-summary'],
    queryFn: () => accountsApi.getSummary().then(res => res.data.data),
  });

  const { data: payoutPreview, isLoading: payoutLoading, error: payoutError } = useQuery({
    queryKey: ['staff-work-payout-preview', selectedMonth, selectedYear, selectedStaffId],
    queryFn: () => accountsApi.getStaffWorkPayoutPreview(selectedMonth, selectedYear, selectedStaffId)
      .then(res => res.data.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data.data),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (summaryError) {
    return <ErrorMessage message="Failed to load account data" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">Financial overview and staff payout calculations</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card border-success-200 bg-success-50">
          <div className="text-center">
            <p className="text-sm font-medium text-success-600">Total Income</p>
            <p className="text-3xl font-bold text-success-700">
              {formatCurrency(summary!.totals.totalIncomeNrs)}
            </p>
          </div>
        </div>

        <div className="card border-error-200 bg-error-50">
          <div className="text-center">
            <p className="text-sm font-medium text-error-600">Total Expenses</p>
            <p className="text-3xl font-bold text-error-700">
              {formatCurrency(summary!.totals.totalExpenseNrs)}
            </p>
          </div>
        </div>

        <div className={`card ${summary!.totals.netNrs >= 0 ? 'border-primary-200 bg-primary-50' : 'border-error-200 bg-error-50'}`}>
          <div className="text-center">
            <p className={`text-sm font-medium ${summary!.totals.netNrs >= 0 ? 'text-primary-600' : 'text-error-600'}`}>
              Net Profit
            </p>
            <p className={`text-3xl font-bold ${summary!.totals.netNrs >= 0 ? 'text-primary-700' : 'text-error-700'}`}>
              {formatCurrency(summary!.totals.netNrs)}
            </p>
          </div>
        </div>
      </div>

      {/* Staff Work Payout Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Staff Work Payout Preview</h2>
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedStaffId || ''}
              onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : undefined)}
              className="input"
            >
              <option value="">All Staff</option>
              {staff?.filter(s => s.type === 'WORK_BASIS').map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {payoutLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : payoutError ? (
          <ErrorMessage message="Failed to load payout preview" />
        ) : (
          <div className="space-y-6">
            {payoutPreview?.map((preview: any) => (
              <div key={preview.staffId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{preview.staffName}</h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-xl font-bold text-primary-600">
                      {formatCurrency(preview.totalAmount)}
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Work Item
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Client
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Unit Rate
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preview.works.map((work: any) => (
                        <tr key={work.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{work.workItem}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{work.client}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{work.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(work.unitRate)}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{formatCurrency(work.total)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatDate(work.performedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            
            {payoutPreview?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No work records found for the selected period</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Income and Expense Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Client</h3>
          <div className="space-y-3">
            {summary!.incomeByClient.map((item) => (
              <div key={item.clientId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-medium text-success-600">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
            {summary!.incomeByClient.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No income data available</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Source</h3>
          <div className="space-y-3">
            {summary!.expenseBySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-600">
                  {item.source.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-sm font-medium text-error-600">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
            {summary!.expenseBySource.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No expense data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}