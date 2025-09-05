import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { formatCurrency } from '../utils/formatters';
import { ArrowLeft } from 'lucide-react';
import { MonthYearPicker } from '../components/ui/month-year-picker';

interface StaffWork {
  id: number;
  workItemId?: number | null;
  clientId?: number | null;
  quantity?: number | null;
  unitRateNrs?: number | null;
  performedAt: string;
  title?: string | null;
  description?: string | null;
  workItem?: {
    id: number;
    title: string;
    rateNrs: number;
  } | null;
  client?: {
    id: number;
    name: string;
  } | null;
}

interface Expense {
  id: number;
  amountNrs: number;
  source: string;
  note: string;
  paidAt: string;
}

interface StaffDetails {
  id: number;
  name: string;
  type: 'MONTHLY' | 'WORK_BASIS';
  monthlySalaryNrs: number | null;
  isActive: boolean;
  staffWorks: StaffWork[];
  expenses: Expense[];
}

export function StaffDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Default to current month and year
  const [selectedDate] = useState<Date>(new Date());

  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null
  });

  const { data: staffData, isLoading, error } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.getById(Number(id), {}).then(res => res.data.data),
  });

  // Memoize the date range to prevent unnecessary re-renders
  const dateRangeString = JSON.stringify(dateRange);
  
  // Filter data based on selected date range
  const filteredData = React.useMemo(() => {
    if (!staffData) return null;
    
    if (!dateRange.startDate || !dateRange.endDate) {
      return staffData; // Return all data if no date range is selected
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    return {
      ...staffData,
      staffWorks: staffData.staffWorks?.filter(work => {
        const workDate = new Date(work.performedAt);
        return workDate >= startDate && workDate <= endDate;
      }) || [],
      expenses: staffData.expenses?.filter(expense => {
        const expenseDate = new Date(expense.paidAt);
        return expenseDate >= startDate && expenseDate <= endDate;
      }) || []
    };
  }, [staffData, dateRangeString]); // Only depend on the stringified date range

  const handleDateChange = useCallback((startDate: string | null, endDate: string | null) => {
    setDateRange(prev => {
      // Only update if the date range has actually changed
      if (prev.startDate === startDate && prev.endDate === endDate) {
        return prev;
      }
      return { startDate, endDate };
    });
  }, []);

  if (isLoading || !filteredData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load staff details" />;
  }

  const staff = filteredData as StaffDetails;

  if (!staff) {
    return <div>Staff not found</div>;
  }

  const totalEarnings = staff.staffWorks.reduce((sum, work) => {
    // For work-basis staff
    if (work.workItemId && work.quantity && work.unitRateNrs) {
      return sum + (work.unitRateNrs * work.quantity);
    }
    // For monthly staff (if needed in future)
    return sum;
  }, 0);

  const totalExpenses = staff.expenses.reduce((sum, expense) => {
    return sum + expense.amountNrs;
  }, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Staff
        </button>
        <MonthYearPicker 
          onChange={handleDateChange} 
          initialDate={selectedDate}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{staff.name}'s Details</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p><span className="font-medium">ID:</span> {staff.id}</p>
            <p>
              <span className="font-medium">Type:</span>{' '}
              <span className={`px-2 py-1 text-xs rounded-full ${
                staff.type === 'MONTHLY' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {staff.type.replace('_', ' ')}
              </span>
            </p>
            {staff.type === 'MONTHLY' && staff.monthlySalaryNrs && (
              <p><span className="font-medium">Monthly Salary:</span> {formatCurrency(staff.monthlySalaryNrs)}</p>
            )}
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-1 text-xs rounded-full ${
                staff.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {staff.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Summary</h3>
            <p><span className="font-medium">Total Works:</span> {staff.staffWorks.length}</p>
            <p><span className="font-medium">Total Earnings:</span> {formatCurrency(totalEarnings)}</p>
            <p><span className="font-medium">Total Expenses:</span> {formatCurrency(totalExpenses)}</p>
            <p className="mt-2 pt-2 border-t">
              <span className="font-medium">Net Balance:</span>{' '}
              <span className={totalEarnings - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(totalEarnings - totalExpenses)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Work History</h2>
        {staff.staffWorks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  {staff.type === 'WORK_BASIS' && (
                    <>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.staffWorks.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(work.performedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {work.workItem?.title || work.title || 'N/A'}
                      {work.description && (
                        <p className="text-xs text-gray-500 mt-1">{work.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{work.client?.name || 'N/A'}</td>
                    {staff.type === 'WORK_BASIS' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{work.quantity || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {work.unitRateNrs ? formatCurrency(work.unitRateNrs) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          {work.quantity && work.unitRateNrs 
                            ? formatCurrency(work.unitRateNrs * work.quantity)
                            : 'N/A'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              {staff.type === 'WORK_BASIS' && (
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total:</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(totalEarnings)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No work records found</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Expenses</h2>
        {staff.expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(expense.paidAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.source.replace(/_/g, ' ').toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{expense.note || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-red-600">
                      -{formatCurrency(expense.amountNrs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total Expenses:</td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-red-600">
                    -{formatCurrency(totalExpenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No expense records found</p>
        )}
      </div>
    </div>
  );
}

export default StaffDetailsPage;