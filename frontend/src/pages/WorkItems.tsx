import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { workItemsApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { WorkItem, CreateWorkItemRequest } from '../types/api';

const workItemSchema = yup.object({
  title: yup.string().required('Title is required'),
  rateNrs: yup.number().positive('Rate must be positive').required('Rate is required'),
  isActive: yup.boolean(),
});

type WorkItemFormData = yup.InferType<typeof workItemSchema>;

export function WorkItems() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);

  const { data: workItems, isLoading, error } = useQuery({
    queryKey: ['work-items'],
    queryFn: () => workItemsApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: workItemsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateWorkItemRequest> }) =>
      workItemsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
      setIsEditModalOpen(false);
      setSelectedWorkItem(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workItemsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<WorkItemFormData>({
    resolver: yupResolver(workItemSchema),
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
  } = useForm<WorkItemFormData>({
    resolver: yupResolver(workItemSchema),
  });

  const onCreateSubmit = (data: WorkItemFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: WorkItemFormData) => {
    if (selectedWorkItem) {
      updateMutation.mutate({ id: selectedWorkItem.id, data });
    }
  };

  const handleEdit = (workItem: WorkItem) => {
    setSelectedWorkItem(workItem);
    setEditValue('title', workItem.title);
    setEditValue('rateNrs', workItem.rateNrs);
    setEditValue('isActive', workItem.isActive);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this work item?')) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load work items" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Items</h1>
          <p className="mt-1 text-sm text-gray-600">Manage service offerings and their rates</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Work Item
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Rate (NPR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workItems?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="font-medium">{item.title}</td>
                  <td>{formatCurrency(item.rateNrs)}</td>
                  <td>
                    <span className={`badge ${item.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
          {workItems?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No work items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Work Item"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input {...registerCreate('title')} className="input mt-1" placeholder="e.g., Still Graphic" />
            {createErrors.title && <ErrorMessage message={createErrors.title.message!} className="mt-1" />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Rate (NPR)</label>
            <input {...registerCreate('rateNrs')} type="number" className="input mt-1" />
            {createErrors.rateNrs && <ErrorMessage message={createErrors.rateNrs.message!} className="mt-1" />}
          </div>

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
                'Create Work Item'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Work Item"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input {...registerEdit('title')} className="input mt-1" />
            {editErrors.title && <ErrorMessage message={editErrors.title.message!} className="mt-1" />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Rate (NPR)</label>
            <input {...registerEdit('rateNrs')} type="number" className="input mt-1" />
            {editErrors.rateNrs && <ErrorMessage message={editErrors.rateNrs.message!} className="mt-1" />}
          </div>

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
                'Update Work Item'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}