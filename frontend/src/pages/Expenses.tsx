import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { expensesApi, staffApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Expense, CreateExpenseRequest, ExpenseSource } from '../types/api';

const expenseSchema = yup.object({
  staffId: yup.string().optional(),
  amountNrs: yup.number().positive('Amount must be positive').required('Amount is required'),
  source: yup.string().oneOf(['STAFF_MONTHLY', 'STAFF_WORK_BASIS', 'GENERAL']).required('Source is required'),
  note: yup.string(),
  paidAt: yup.string(),
});

type ExpenseFormData = yup.InferType<typeof expenseSchema>;

export function Expenses() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll().then(res => res.data.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateExpenseRequest> }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsEditModalOpen(false);
      setSelectedExpense(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<ExpenseFormData>({
    resolver: yupResolver(expenseSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
    setValue: setEditValue,
  } = useForm<ExpenseFormData>({
    resolver: yupResolver(expenseSchema),
  });

  const onCreateSubmit = (formData: ExpenseFormData) => {
    const data: CreateExpenseRequest = {
      staffId: formData.staffId ? Number(formData.staffId) : undefined,
      amountNrs: formData.amountNrs,
      source: formData.source as ExpenseSource,
      note: formData.note,
      paidAt: formData.paidAt,
    };

    createMutation.mutate(data);
  };

  const onEditSubmit = (formData: ExpenseFormData) => {
    if (selectedExpense) {
      const data: Partial<CreateExpenseRequest> = {
        staffId: formData.staffId ? Number(formData.staffId) : undefined,
        amountNrs: formData.amountNrs,
        source: formData.source as ExpenseSource,
        note: formData.note,
        paidAt: formData.paidAt,
      };

      updateMutation.mutate({ 
        id: selectedExpense.id, 
        data 
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    // Convert staffId to string for the form, or empty string if undefined
    setEditValue('staffId', expense.staffId ? String(expense.staffId) : '');
    setEditValue('amountNrs', expense.amountNrs);
    setEditValue('source', expense.source);
    setEditValue('note', expense.note || '');
    setEditValue('paidAt', expense.paidAt.split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      deleteMutation.mutate(id);
    }
  };

  const getExpenseSourceColor = (source: ExpenseSource) => {
    switch (source) {
      case 'STAFF_MONTHLY': return 'badge-success';
      case 'STAFF_WORK_BASIS': return 'badge-warning';
      case 'GENERAL': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load expenses" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-600">Track all business expenses and staff payouts</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Note</th>
                <th>Paid At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses?.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td>{expense.staff?.name || 'N/A'}</td>
                  <td className="font-medium text-error-600">{formatCurrency(expense.amountNrs)}</td>
                  <td>
                    <span className={`badge ${getExpenseSourceColor(expense.source)}`}>
                      {expense.source.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td>{expense.note || '-'}</td>
                  <td>{formatDate(expense.paidAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-error-600 hover:text-error-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No expense records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Expense"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Staff (Optional)</label>
            <select {...registerCreate('staffId')} className="input mt-1">
              <option value="">Select staff</option>
              {staff?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (NPR)</label>
            <input {...registerCreate('amountNrs')} type="number" className="input mt-1" />
            {createErrors.amountNrs && <ErrorMessage message={createErrors.amountNrs.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <select {...registerCreate('source')} className="input mt-1">
              <option value="">Select source</option>
              <option value="STAFF_MONTHLY">Staff Monthly</option>
              <option value="STAFF_WORK_BASIS">Staff Work Basis</option>
              <option value="GENERAL">General</option>
            </select>
            {createErrors.source && <ErrorMessage message={createErrors.source.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea {...registerCreate('note')} className="input mt-1" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Paid At</label>
            <input {...registerCreate('paidAt')} type="date" className="input mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Expense'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Expense"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Staff (Optional)</label>
            <select {...registerEdit('staffId')} className="input mt-1">
              <option value="">Select staff</option>
              {staff?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (NPR)</label>
            <input {...registerEdit('amountNrs')} type="number" className="input mt-1" />
            {editErrors.amountNrs && <ErrorMessage message={editErrors.amountNrs.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <select {...registerEdit('source')} className="input mt-1">
              <option value="STAFF_MONTHLY">Staff Monthly</option>
              <option value="STAFF_WORK_BASIS">Staff Work Basis</option>
              <option value="GENERAL">General</option>
            </select>
            {editErrors.source && <ErrorMessage message={editErrors.source.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea {...registerEdit('note')} className="input mt-1" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Paid At</label>
            <input {...registerEdit('paidAt')} type="date" className="input mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                'Update Expense'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}