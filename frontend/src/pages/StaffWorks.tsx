import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { staffWorksApi, staffApi, workItemsApi, clientsApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { StaffWork, CreateStaffWorkRequest, StaffType } from '../types/api';

const staffWorkSchema = yup.object({
  staffId: yup.number().positive('Staff is required').required('Staff is required'),
  staffType: yup.string().oneOf(['MONTHLY', 'WORK_BASIS']).required('Staff type is required') as yup.Schema<StaffType>,
  
  // Work-basis specific fields
  workItemId: yup.lazy((value, context) => {
    const staffType = context.parent.staffType;
    return staffType === 'WORK_BASIS' 
      ? yup.number().positive('Work item is required').required('Work item is required')
      : yup.number().notRequired();
  }),
  quantity: yup.lazy((value, context) => {
    const staffType = context.parent.staffType;
    return staffType === 'WORK_BASIS' 
      ? yup.number().positive('Quantity must be positive').required('Quantity is required')
      : yup.number().notRequired();
  }),
  unitRateNrs: yup.lazy((value, context) => {
    const staffType = context.parent.staffType;
    return staffType === 'WORK_BASIS' 
      ? yup.string().test('is-valid-rate', 'Rate must be a non-negative number', (value) => {
          if (value === undefined || value === '') return true;
          const num = Number(value);
          return !isNaN(num) && num >= 0;
        }).required('Unit rate is required')
      : yup.string().notRequired();
  }),
  
  // Monthly staff specific fields
  title: yup.lazy((value, context) => {
    const staffType = context.parent.staffType;
    return staffType === 'MONTHLY' 
      ? yup.string().required('Title is required for monthly staff')
      : yup.string().notRequired();
  }),
  description: yup.lazy((value, context) => {
    const staffType = context.parent.staffType;
    return staffType === 'MONTHLY' 
      ? yup.string().required('Description is required for monthly staff')
      : yup.string().notRequired();
  }),
  
  // Common fields
  clientId: yup.number().positive('Client must be valid').notRequired(),
  performedAt: yup.string().required('Performed date is required'),
});

type StaffWorkFormData = yup.InferType<typeof staffWorkSchema>;

export function StaffWorks() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaffWork, setSelectedStaffWork] = useState<StaffWork | null>(null);

  const { data: staffWorks, isLoading, error } = useQuery({
    queryKey: ['staff-works'],
    queryFn: () => staffWorksApi.getAll().then(res => res.data.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data.data),
  });

  const { data: workItems } = useQuery({
    queryKey: ['work-items'],
    queryFn: () => workItemsApi.getAll().then(res => res.data.data),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: staffWorksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-works'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateStaffWorkRequest> }) =>
      staffWorksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-works'] });
      setIsEditModalOpen(false);
      setSelectedStaffWork(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: staffWorksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-works'] });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
    watch: watchCreate,
    setValue: setCreateValue,
  } = useForm<StaffWorkFormData>({
    resolver: yupResolver(staffWorkSchema),
    defaultValues: {
      staffType: 'WORK_BASIS' as StaffType,
      quantity: 1,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
    setValue: setEditValue,
    watch: watchEdit,
  } = useForm<StaffWorkFormData>({
    resolver: yupResolver(staffWorkSchema),
    defaultValues: {
      staffType: 'WORK_BASIS' as StaffType,
    },
  });

  // Dynamic field management for create form
  useEffect(() => {
    const staffType = watchCreate('staffType');
    if (staffType === 'MONTHLY') {
      setCreateValue('workItemId', undefined);
      setCreateValue('quantity', undefined);
      setCreateValue('unitRateNrs', undefined);
    } else {
      setCreateValue('title', undefined);
      setCreateValue('description', undefined);
    }
  }, [watchCreate('staffType'), setCreateValue]);

  const onCreateSubmit = (formData: StaffWorkFormData) => {
    const data: CreateStaffWorkRequest = {
      staffId: formData.staffId,
      workItemId: formData.staffType === 'WORK_BASIS' 
        ? (formData.workItemId as number | undefined) 
        : undefined,
      clientId: formData.clientId || undefined,
      quantity: formData.staffType === 'WORK_BASIS' 
        ? (formData.quantity as number | undefined) 
        : undefined,
      unitRateNrs: formData.staffType === 'WORK_BASIS' 
        ? (formData.unitRateNrs ? Number(formData.unitRateNrs) : undefined)
        : undefined,
      title: formData.staffType === 'MONTHLY' 
        ? (formData.title as string | undefined) 
        : undefined,
      description: formData.staffType === 'MONTHLY' 
        ? (formData.description as string | undefined) 
        : undefined,
      performedAt: formData.performedAt,
    };
    createMutation.mutate(data);
  };

  const onEditSubmit = (formData: StaffWorkFormData) => {
    if (selectedStaffWork) {
      const data: Partial<CreateStaffWorkRequest> = {
        staffId: formData.staffId,
        workItemId: formData.staffType === 'WORK_BASIS' 
          ? (formData.workItemId as number | undefined) 
          : undefined,
        clientId: formData.clientId || undefined,
        quantity: formData.staffType === 'WORK_BASIS' 
          ? (formData.quantity as number | undefined) 
          : undefined,
        unitRateNrs: formData.staffType === 'WORK_BASIS' 
          ? (formData.unitRateNrs ? Number(formData.unitRateNrs) : undefined)
          : undefined,
        title: formData.staffType === 'MONTHLY' 
          ? (formData.title as string | undefined) 
          : undefined,
        description: formData.staffType === 'MONTHLY' 
          ? (formData.description as string | undefined) 
          : undefined,
        performedAt: formData.performedAt,
      };
      updateMutation.mutate({ id: selectedStaffWork.id, data });
    }
  };

  const handleEdit = (staffWork: StaffWork) => {
    const staffMember = staff?.find(s => s.id === staffWork.staffId);
    setSelectedStaffWork(staffWork);
    setEditValue('staffType', (staffMember?.type || 'WORK_BASIS') as StaffType);
    setEditValue('staffId', staffWork.staffId);
    setEditValue('workItemId', staffWork.workItemId ?? undefined);
    setEditValue('clientId', staffWork.clientId ?? undefined);
    setEditValue('quantity', staffWork.quantity ?? undefined);
    setEditValue('unitRateNrs', staffWork.unitRateNrs?.toString() ?? '');
    setEditValue('title', staffWork.title ?? undefined);
    setEditValue('description', staffWork.description ?? undefined);
    setEditValue('performedAt', staffWork.performedAt.split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this staff work record?')) {
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
    return <ErrorMessage message="Failed to load staff works" />;
  }

  // Table rendering with null/undefined handling
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Works</h1>
          <p className="mt-1 text-sm text-gray-600">Track work performed by staff members</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Work
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Work Item</th>
                <th>Client</th>
                <th>Quantity</th>
                <th>Unit Rate</th>
                <th>Total</th>
                <th>Performed At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staffWorks?.map((work) => (
                <tr key={work.id} className="hover:bg-gray-50">
                  <td className="font-medium">{work.staff?.name}</td>
                  <td>{work.workItem?.title || work.title || 'N/A'}</td>
                  <td>{work.client?.name || 'No Client'}</td>
                  <td>{work.quantity ?? 'N/A'}</td>
                  <td>{work.unitRateNrs ? formatCurrency(work.unitRateNrs) : 'N/A'}</td>
                  <td className="font-medium">
                    {work.quantity && work.unitRateNrs 
                      ? formatCurrency(work.quantity * work.unitRateNrs) 
                      : 'N/A'}
                  </td>
                  <td>{formatDate(work.performedAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(work)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(work.id)}
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
          {staffWorks?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No staff work records found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Staff Work"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Staff</label>
            <select 
              {...registerCreate('staffId')} 
              className="input mt-1"
              onChange={(e) => {
                const selectedStaff = staff?.find(s => s.id === Number(e.target.value));
                setCreateValue('staffType', (selectedStaff?.type || 'WORK_BASIS') as StaffType);
              }}
            >
              <option value="">Select staff</option>
              {staff?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.type})
                </option>
              ))}
            </select>
            {createErrors.staffId && <ErrorMessage message={createErrors.staffId.message!} className="mt-1" />}
          </div>
          
          {watchCreate('staffType') === 'WORK_BASIS' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Work Item</label>
                <select {...registerCreate('workItemId')} className="input mt-1">
                  <option value="">Select work item</option>
                  {workItems?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({formatCurrency(item.rateNrs)})
                    </option>
                  ))}
                </select>
                {createErrors.workItemId && <ErrorMessage message={createErrors.workItemId.message!} className="mt-1" />}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input {...registerCreate('quantity')} type="number" className="input mt-1" />
                  {createErrors.quantity && <ErrorMessage message={createErrors.quantity.message!} className="mt-1" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Rate (NPR)</label>
                  <input 
                    {...registerCreate('unitRateNrs')} 
                    type="number" 
                    className="input mt-1" 
                    min="0"
                    step="0.01"
                  />
                  {createErrors.unitRateNrs && <ErrorMessage message={createErrors.unitRateNrs.message!} className="mt-1" />}
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use work item default rate</p>
                </div>
              </div>
            </>
          )}

          {watchCreate('staffType') === 'MONTHLY' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input {...registerCreate('title')} type="text" className="input mt-1" />
                {createErrors.title && <ErrorMessage message={createErrors.title.message!} className="mt-1" />}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  {...registerCreate('description')} 
                  className="input mt-1" 
                  rows={3}
                />
                {createErrors.description && <ErrorMessage message={createErrors.description.message!} className="mt-1" />}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Client (Optional)</label>
            <select {...registerCreate('clientId')} className="input mt-1">
              <option value="">Select client</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Performed At</label>
            <input {...registerCreate('performedAt')} type="date" className="input mt-1" />
            {createErrors.performedAt && <ErrorMessage message={createErrors.performedAt.message!} className="mt-1" />}
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
                'Create Staff Work'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Work"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Staff</label>
            <select 
              {...registerEdit('staffId')} 
              className="input mt-1"
              onChange={(e) => {
                const selectedStaff = staff?.find(s => s.id === Number(e.target.value));
                setEditValue('staffType', (selectedStaff?.type || 'WORK_BASIS') as StaffType);
              }}
            >
              <option value="">Select staff</option>
              {staff?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.type})
                </option>
              ))}
            </select>
            {editErrors.staffId && <ErrorMessage message={editErrors.staffId.message!} className="mt-1" />}
          </div>
          
          {watchEdit('staffType') === 'WORK_BASIS' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Work Item</label>
                <select {...registerEdit('workItemId')} className="input mt-1">
                  <option value="">Select work item</option>
                  {workItems?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({formatCurrency(item.rateNrs)})
                    </option>
                  ))}
                </select>
                {editErrors.workItemId && <ErrorMessage message={editErrors.workItemId.message!} className="mt-1" />}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input {...registerEdit('quantity')} type="number" className="input mt-1" />
                  {editErrors.quantity && <ErrorMessage message={editErrors.quantity.message!} className="mt-1" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Rate (NPR)</label>
                  <input 
                    {...registerEdit('unitRateNrs')} 
                    type="number" 
                    className="input mt-1" 
                    min="0"
                    step="0.01"
                  />
                  {editErrors.unitRateNrs && <ErrorMessage message={editErrors.unitRateNrs.message!} className="mt-1" />}
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use work item default rate</p>
                </div>
              </div>
            </>
          )}

          {watchEdit('staffType') === 'MONTHLY' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input {...registerEdit('title')} type="text" className="input mt-1" />
                {editErrors.title && <ErrorMessage message={editErrors.title.message!} className="mt-1" />}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  {...registerEdit('description')} 
                  className="input mt-1" 
                  rows={3}
                />
                {editErrors.description && <ErrorMessage message={editErrors.description.message!} className="mt-1" />}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Client (Optional)</label>
            <select {...registerEdit('clientId')} className="input mt-1">
              <option value="">Select client</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Performed At</label>
            <input {...registerEdit('performedAt')} type="date" className="input mt-1" />
            {editErrors.performedAt && <ErrorMessage message={editErrors.performedAt.message!} className="mt-1" />}
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
                'Update Staff Work'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}