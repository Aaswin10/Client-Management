import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { staffApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Staff, CreateStaffRequest, StaffType, MonthlyPayoutRequest } from '../types/api';

const staffSchema = yup.object({
  name: yup.string().required('Name is required'),
  type: yup.string().oneOf(['MONTHLY', 'WORK_BASIS']).required('Type is required'),
  monthlySalaryNrs: yup.number().min(0, 'Salary must be non-negative'),
  isActive: yup.boolean(),
});

const payoutSchema = yup.object({
  amountNrs: yup.number().positive('Amount must be positive').required('Amount is required'),
  note: yup.string(),
  paidAt: yup.string(),
});

type StaffFormData = yup.InferType<typeof staffSchema>;
type PayoutFormData = yup.InferType<typeof payoutSchema>;

export function Staff() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const { data: staff, isLoading, error } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateStaffRequest> }) =>
      staffApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsEditModalOpen(false);
      setSelectedStaff(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: staffApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MonthlyPayoutRequest }) =>
      staffApi.monthlyPayout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsPayoutModalOpen(false);
      setSelectedStaff(null);
      resetPayoutForm();
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
    watch: watchCreate,
  } = useForm<StaffFormData>({
    resolver: yupResolver(staffSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
    setValue: setEditValue,
    watch: watchEdit,
  } = useForm<StaffFormData>({
    resolver: yupResolver(staffSchema),
  });

  const {
    register: registerPayout,
    handleSubmit: handlePayoutSubmit,
    formState: { errors: payoutErrors },
    reset: resetPayoutForm,
  } = useForm<PayoutFormData>({
    resolver: yupResolver(payoutSchema),
  });

  const createType = watchCreate('type');
  const editType = watchEdit('type');

  const onCreateSubmit = (formData: StaffFormData) => {
    const data: CreateStaffRequest = {
      name: formData.name,
      type: formData.type as StaffType,
      monthlySalaryNrs: formData.monthlySalaryNrs,
      isActive: formData.isActive ?? true,
    };

    createMutation.mutate(data);
  };

  const onEditSubmit = (formData: StaffFormData) => {
    if (selectedStaff) {
      const data: Partial<CreateStaffRequest> = {
        name: formData.name,
        type: formData.type as StaffType,
        monthlySalaryNrs: formData.monthlySalaryNrs,
        isActive: formData.isActive ?? true,
      };

      updateMutation.mutate({ 
        id: selectedStaff.id, 
        data 
      });
    }
  };

  const onPayoutSubmit = (data: PayoutFormData) => {
    if (selectedStaff) {
      payoutMutation.mutate({ id: selectedStaff.id, data });
    }
  };

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditValue('name', staff.name);
    setEditValue('type', staff.type);
    setEditValue('monthlySalaryNrs', staff.monthlySalaryNrs || 0);
    setEditValue('isActive', staff.isActive);
    setIsEditModalOpen(true);
  };

  const handlePayout = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsPayoutModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStaffTypeColor = (type: StaffType) => {
    switch (type) {
      case 'MONTHLY': return 'badge-success';
      case 'WORK_BASIS': return 'badge-warning';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load staff" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your team members and their compensation</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Monthly Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staff?.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="font-medium">
                    <Link to={`/staff/${member.id}`} className='hover:underline'>{member.name}</Link>
                  </td>
                  <td>
                    <span className={`badge ${getStaffTypeColor(member.type)}`}>
                      {member.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {member.monthlySalaryNrs ? formatCurrency(member.monthlySalaryNrs) : 'N/A'}
                  </td>
                  <td>
                    <span className={`badge ${member.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {member.type === 'MONTHLY' && (
                        <button
                          onClick={() => handlePayout(member)}
                          className="text-success-600 hover:text-success-700"
                          title="Monthly Payout"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(member.id)}
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
          {staff?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No staff members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Staff Member"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input {...registerCreate('name')} className="input mt-1" />
            {createErrors.name && <ErrorMessage message={createErrors.name.message!} className="mt-1" />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select {...registerCreate('type')} className="input mt-1">
              <option value="">Select type</option>
              <option value="MONTHLY">Monthly</option>
              <option value="WORK_BASIS">Work Basis</option>
            </select>
            {createErrors.type && <ErrorMessage message={createErrors.type.message!} className="mt-1" />}
          </div>

          {createType === 'MONTHLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Salary (NPR)</label>
              <input {...registerCreate('monthlySalaryNrs')} type="number" className="input mt-1" />
              {createErrors.monthlySalaryNrs && <ErrorMessage message={createErrors.monthlySalaryNrs.message!} className="mt-1" />}
            </div>
          )}

          <div className="flex items-center">
            <input {...registerCreate('isActive')} type="checkbox" className="h-4 w-4 text-primary-600 rounded" />
            <label className="ml-2 text-sm text-gray-700">Active</label>
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
                'Create Staff'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input {...registerEdit('name')} className="input mt-1" />
            {editErrors.name && <ErrorMessage message={editErrors.name.message!} className="mt-1" />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select {...registerEdit('type')} className="input mt-1">
              <option value="MONTHLY">Monthly</option>
              <option value="WORK_BASIS">Work Basis</option>
            </select>
            {editErrors.type && <ErrorMessage message={editErrors.type.message!} className="mt-1" />}
          </div>

          {editType === 'MONTHLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Salary (NPR)</label>
              <input {...registerEdit('monthlySalaryNrs')} type="number" className="input mt-1" />
              {editErrors.monthlySalaryNrs && <ErrorMessage message={editErrors.monthlySalaryNrs.message!} className="mt-1" />}
            </div>
          )}

          <div className="flex items-center">
            <input {...registerEdit('isActive')} type="checkbox" className="h-4 w-4 text-primary-600 rounded" />
            <label className="ml-2 text-sm text-gray-700">Active</label>
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
                'Update Staff'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Monthly Payout Modal */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title={`Monthly Payout - ${selectedStaff?.name}`}
      >
        <form onSubmit={handlePayoutSubmit(onPayoutSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (NPR)</label>
            <input {...registerPayout('amountNrs')} type="number" className="input mt-1" />
            {payoutErrors.amountNrs && <ErrorMessage message={payoutErrors.amountNrs.message!} className="mt-1" />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea {...registerPayout('note')} className="input mt-1" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Paid At</label>
            <input {...registerPayout('paidAt')} type="date" className="input mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsPayoutModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={payoutMutation.isPending}
              className="btn-success"
            >
              {payoutMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Process Payout'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}