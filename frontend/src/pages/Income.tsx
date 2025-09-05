import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { incomeApi, clientsApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Income, CreateIncomeRequest } from '../types/api';

const incomeSchema = yup.object({
  clientId: yup.number().positive('Client is required').required('Client is required'),
  amountNrs: yup.number().positive('Amount must be positive').required('Amount is required'),
  note: yup.string(),
  receivedAt: yup.string(),
});

type IncomeFormData = yup.InferType<typeof incomeSchema>;

export function Income() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  const { data: incomes, isLoading, error } = useQuery({
    queryKey: ['income'],
    queryFn: () => incomeApi.getAll().then(res => res.data.data),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: incomeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateIncomeRequest> }) =>
      incomeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      setIsEditModalOpen(false);
      setSelectedIncome(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: incomeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<IncomeFormData>({
    resolver: yupResolver(incomeSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
    setValue: setEditValue,
  } = useForm<IncomeFormData>({
    resolver: yupResolver(incomeSchema),
  });

  const onCreateSubmit = (data: IncomeFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: IncomeFormData) => {
    if (selectedIncome) {
      updateMutation.mutate({ id: selectedIncome.id, data });
    }
  };

  const handleEdit = (income: Income) => {
    setSelectedIncome(income);
    setEditValue('clientId', income.clientId);
    setEditValue('amountNrs', income.amountNrs);
    setEditValue('note', income.note || '');
    setEditValue('receivedAt', income.receivedAt.split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      deleteMutation.mutate(id);
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
    return <ErrorMessage message="Failed to load income records" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <p className="mt-1 text-sm text-gray-600">Track income received from clients</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Received At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {incomes?.map((income) => (
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="font-medium">{income.client?.name}</td>
                  <td className="font-medium text-success-600">{formatCurrency(income.amountNrs)}</td>
                  <td>{income.note || '-'}</td>
                  <td>{formatDate(income.receivedAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(income)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
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
          {incomes?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No income records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Income"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client</label>
            <select {...registerCreate('clientId')} className="input mt-1">
              <option value="">Select client</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {createErrors.clientId && <ErrorMessage message={createErrors.clientId.message!} className="mt-1" />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (NPR)</label>
            <input {...registerCreate('amountNrs')} type="number" className="input mt-1" />
            {createErrors.amountNrs && <ErrorMessage message={createErrors.amountNrs.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea {...registerCreate('note')} className="input mt-1" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Received At</label>
            <input {...registerCreate('receivedAt')} type="date" className="input mt-1" />
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
                'Create Income'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Income"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client</label>
            <select {...registerEdit('clientId')} className="input mt-1">
              <option value="">Select client</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {editErrors.clientId && <ErrorMessage message={editErrors.clientId.message!} className="mt-1" />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (NPR)</label>
            <input {...registerEdit('amountNrs')} type="number" className="input mt-1" />
            {editErrors.amountNrs && <ErrorMessage message={editErrors.amountNrs.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea {...registerEdit('note')} className="input mt-1" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Received At</label>
            <input {...registerEdit('receivedAt')} type="date" className="input mt-1" />
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
                'Update Income'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}