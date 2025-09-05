import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { paymentsApi, influencersApi, collaborationsApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2, CreditCard, Filter, AlertTriangle } from 'lucide-react';
import type { 
  Payment, 
  CreatePaymentRequest, 
  PaymentStatus, 
  PaymentMethod 
} from '../types/api';

const paymentSchema = yup.object({
  influencerId: yup.number().positive('Influencer is required').required('Influencer is required'),
  collaborationId: yup.number().optional(),
  amountNrs: yup.number().positive('Amount must be positive').required('Amount is required'),
  status: yup.string().oneOf(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  paymentMethod: yup.string().oneOf(['BANK_TRANSFER', 'CASH', 'CHEQUE', 'DIGITAL_WALLET', 'CREDIT_CARD', 'OTHER']),
  transactionId: yup.string(),
  paymentDate: yup.string(),
  dueDate: yup.string(),
  notes: yup.string(),
});

type PaymentFormData = yup.InferType<typeof paymentSchema>;

export function Payments() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.getAll().then(res => res.data.data),
  });

  const { data: influencers } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => influencersApi.getAll().then(res => res.data.data),
  });

  const { data: collaborations } = useQuery({
    queryKey: ['collaborations'],
    queryFn: () => collaborationsApi.getAll().then(res => res.data.data),
  });

  const { data: overduePayments } = useQuery({
    queryKey: ['overdue-payments'],
    queryFn: () => paymentsApi.getOverdue().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePaymentRequest> }) =>
      paymentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsEditModalOpen(false);
      setSelectedPayment(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: paymentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const markOverdueMutation = useMutation({
    mutationFn: paymentsApi.markOverdue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-payments'] });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema),
    defaultValues: {
      status: 'PENDING' as PaymentStatus,
      paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
    setValue: setEditValue,
  } = useForm<PaymentFormData>({
    resolver: yupResolver(paymentSchema),
  });

  const onCreateSubmit = (data: PaymentFormData) => {
    const payload: CreatePaymentRequest = {
      ...data,
      collaborationId: data.collaborationId || undefined,
    };
    createMutation.mutate(payload);
  };

  const onEditSubmit = (data: PaymentFormData) => {
    if (selectedPayment) {
      const payload: Partial<CreatePaymentRequest> = {
        ...data,
        collaborationId: data.collaborationId || undefined,
      };
      updateMutation.mutate({ id: selectedPayment.id, data: payload });
    }
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditValue('influencerId', payment.influencerId);
    setEditValue('collaborationId', payment.collaborationId || undefined);
    setEditValue('amountNrs', payment.amountNrs);
    setEditValue('status', payment.status);
    setEditValue('paymentMethod', payment.paymentMethod);
    setEditValue('transactionId', payment.transactionId || '');
    setEditValue('paymentDate', payment.paymentDate ? payment.paymentDate.split('T')[0] : '');
    setEditValue('dueDate', payment.dueDate ? payment.dueDate.split('T')[0] : '');
    setEditValue('notes', payment.notes || '');
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleMarkOverdue = () => {
    if (confirm('Mark all pending payments past due date as overdue?')) {
      markOverdueMutation.mutate();
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'OVERDUE': return 'badge-error';
      case 'CANCELLED': return 'badge-gray';
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

  const filteredPayments = payments?.filter(payment =>
    statusFilter === '' || payment.status === statusFilter
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load payments" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">Track influencer payments and transactions</p>
        </div>
        <div className="flex items-center gap-3">
          {overduePayments && overduePayments.length > 0 && (
            <button
              onClick={handleMarkOverdue}
              className="btn-warning"
              disabled={markOverdueMutation.isPending}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Mark Overdue ({overduePayments.length})
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Influencer</th>
                <th>Campaign</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments?.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="font-medium">{payment.influencer?.name}</td>
                  <td>
                    {payment.collaboration?.campaignName || (
                      <span className="text-gray-500 italic">Standalone Payment</span>
                    )}
                  </td>
                  <td className="font-medium text-success-600">
                    {formatCurrency(payment.amountNrs)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm">
                      {payment.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {payment.dueDate ? (
                      <span className={`text-sm ${
                        payment.status === 'OVERDUE' ? 'text-error-600 font-medium' : ''
                      }`}>
                        {formatDate(payment.dueDate)}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(payment)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id)}
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
          {filteredPayments?.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No payments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Payment"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Influencer</label>
              <select {...registerCreate('influencerId')} className="input mt-1">
                <option value="">Select influencer</option>
                {influencers?.map((influencer) => (
                  <option key={influencer.id} value={influencer.id}>
                    {influencer.name}
                  </option>
                ))}
              </select>
              {createErrors.influencerId && <ErrorMessage message={createErrors.influencerId.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign (Optional)</label>
              <select {...registerCreate('collaborationId')} className="input mt-1">
                <option value="">Select campaign</option>
                {collaborations?.map((collaboration) => (
                  <option key={collaboration.id} value={collaboration.id}>
                    {collaboration.campaignName}
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
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select {...registerCreate('status')} className="input mt-1">
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select {...registerCreate('paymentMethod')} className="input mt-1">
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DIGITAL_WALLET">Digital Wallet</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <input {...registerCreate('transactionId')} className="input mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Date</label>
              <input {...registerCreate('paymentDate')} type="date" className="input mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input {...registerCreate('dueDate')} type="date" className="input mt-1" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea {...registerCreate('notes')} className="input mt-1" rows={3} />
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
                'Create Payment'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Payment"
        size="lg"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Influencer</label>
              <select {...registerEdit('influencerId')} className="input mt-1">
                <option value="">Select influencer</option>
                {influencers?.map((influencer) => (
                  <option key={influencer.id} value={influencer.id}>
                    {influencer.name}
                  </option>
                ))}
              </select>
              {editErrors.influencerId && <ErrorMessage message={editErrors.influencerId.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign (Optional)</label>
              <select {...registerEdit('collaborationId')} className="input mt-1">
                <option value="">Select campaign</option>
                {collaborations?.map((collaboration) => (
                  <option key={collaboration.id} value={collaboration.id}>
                    {collaboration.campaignName}
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
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select {...registerEdit('status')} className="input mt-1">
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select {...registerEdit('paymentMethod')} className="input mt-1">
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DIGITAL_WALLET">Digital Wallet</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <input {...registerEdit('transactionId')} className="input mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Date</label>
              <input {...registerEdit('paymentDate')} type="date" className="input mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input {...registerEdit('dueDate')} type="date" className="input mt-1" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea {...registerEdit('notes')} className="input mt-1" rows={3} />
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
                'Update Payment'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}