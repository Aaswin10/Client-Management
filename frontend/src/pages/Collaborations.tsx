import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collaborationsApi, influencersApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2, Handshake, Filter } from 'lucide-react';
import type { Collaboration, CreateCollaborationRequest } from '../types/api';

const collaborationSchema = yup.object({
  influencerId: yup.number().positive('Influencer is required').required('Influencer is required'),
  campaignName: yup.string().required('Campaign name is required'),
  description: yup.string(),
  deliverables: yup.string().required('Deliverables are required'),
  agreedAmountNrs: yup.number().positive('Amount must be positive').required('Amount is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
  status: yup.string(),
  notes: yup.string(),
});

type CollaborationFormData = yup.InferType<typeof collaborationSchema>;

export function Collaborations() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: collaborations, isLoading, error } = useQuery({
    queryKey: ['collaborations'],
    queryFn: () => collaborationsApi.getAll().then(res => res.data.data),
  });

  const { data: influencers } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => influencersApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: collaborationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCollaborationRequest> }) =>
      collaborationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      setIsEditModalOpen(false);
      setSelectedCollaboration(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: collaborationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<CollaborationFormData>({
    resolver: yupResolver(collaborationSchema),
    defaultValues: {
      status: 'ACTIVE',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
    setValue: setEditValue,
  } = useForm<CollaborationFormData>({
    resolver: yupResolver(collaborationSchema),
  });

  const onCreateSubmit = (data: CollaborationFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: CollaborationFormData) => {
    if (selectedCollaboration) {
      updateMutation.mutate({ id: selectedCollaboration.id, data });
    }
  };

  const handleEdit = (collaboration: Collaboration) => {
    setSelectedCollaboration(collaboration);
    setEditValue('influencerId', collaboration.influencerId);
    setEditValue('campaignName', collaboration.campaignName);
    setEditValue('description', collaboration.description || '');
    setEditValue('deliverables', collaboration.deliverables);
    setEditValue('agreedAmountNrs', collaboration.agreedAmountNrs);
    setEditValue('startDate', collaboration.startDate.split('T')[0]);
    setEditValue('endDate', collaboration.endDate.split('T')[0]);
    setEditValue('status', collaboration.status);
    setEditValue('notes', collaboration.notes || '');
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this collaboration?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'badge-success';
      case 'COMPLETED': return 'badge-gray';
      case 'CANCELLED': return 'badge-error';
      default: return 'badge-warning';
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

  const filteredCollaborations = collaborations?.filter(collaboration =>
    statusFilter === '' || collaboration.status === statusFilter
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load collaborations" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collaborations</h1>
          <p className="mt-1 text-sm text-gray-600">Manage influencer collaboration campaigns</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Collaboration
        </button>
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
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Influencer</th>
                <th>Amount</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCollaborations?.map((collaboration) => (
                <tr key={collaboration.id} className="hover:bg-gray-50">
                  <td className="font-medium">
                    <div>
                      <div className="font-medium">{collaboration.campaignName}</div>
                      {collaboration.description && (
                        <div className="text-sm text-gray-500">{collaboration.description}</div>
                      )}
                    </div>
                  </td>
                  <td>{collaboration.influencer?.name}</td>
                  <td className="font-medium text-success-600">
                    {formatCurrency(collaboration.agreedAmountNrs)}
                  </td>
                  <td>
                    <div className="text-sm">
                      <div>{formatDate(collaboration.startDate)}</div>
                      <div className="text-gray-500">to {formatDate(collaboration.endDate)}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(collaboration.status)}`}>
                      {collaboration.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(collaboration)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(collaboration.id)}
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
          {filteredCollaborations?.length === 0 && (
            <div className="text-center py-8">
              <Handshake className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No collaborations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Collaboration"
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
              <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
              <input {...registerCreate('campaignName')} className="input mt-1" />
              {createErrors.campaignName && <ErrorMessage message={createErrors.campaignName.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (NPR)</label>
              <input {...registerCreate('agreedAmountNrs')} type="number" className="input mt-1" />
              {createErrors.agreedAmountNrs && <ErrorMessage message={createErrors.agreedAmountNrs.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select {...registerCreate('status')} className="input mt-1">
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input {...registerCreate('startDate')} type="date" className="input mt-1" />
              {createErrors.startDate && <ErrorMessage message={createErrors.startDate.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input {...registerCreate('endDate')} type="date" className="input mt-1" />
              {createErrors.endDate && <ErrorMessage message={createErrors.endDate.message!} className="mt-1" />}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea {...registerCreate('description')} className="input mt-1" rows={2} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deliverables</label>
            <textarea {...registerCreate('deliverables')} className="input mt-1" rows={3} />
            {createErrors.deliverables && <ErrorMessage message={createErrors.deliverables.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea {...registerCreate('notes')} className="input mt-1" rows={2} />
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
                'Create Collaboration'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Collaboration"
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
              <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
              <input {...registerEdit('campaignName')} className="input mt-1" />
              {editErrors.campaignName && <ErrorMessage message={editErrors.campaignName.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (NPR)</label>
              <input {...registerEdit('agreedAmountNrs')} type="number" className="input mt-1" />
              {editErrors.agreedAmountNrs && <ErrorMessage message={editErrors.agreedAmountNrs.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select {...registerEdit('status')} className="input mt-1">
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input {...registerEdit('startDate')} type="date" className="input mt-1" />
              {editErrors.startDate && <ErrorMessage message={editErrors.startDate.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input {...registerEdit('endDate')} type="date" className="input mt-1" />
              {editErrors.endDate && <ErrorMessage message={editErrors.endDate.message!} className="mt-1" />}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea {...registerEdit('description')} className="input mt-1" rows={2} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deliverables</label>
            <textarea {...registerEdit('deliverables')} className="input mt-1" rows={3} />
            {editErrors.deliverables && <ErrorMessage message={editErrors.deliverables.message!} className="mt-1" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea {...registerEdit('notes')} className="input mt-1" rows={2} />
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
                'Update Collaboration'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}