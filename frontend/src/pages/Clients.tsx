import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { clientsApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import type { Client, CreateClientRequest, ClientType, AdjustAccountRequest } from '../types/api';
import { Link } from 'react-router-dom';
import { ClientForm } from '../components/ClientForm';

const adjustAccountSchema = yup.object({
  lockedDelta: yup.number(),
  advanceDelta: yup.number(),
});

type AdjustAccountFormData = yup.InferType<typeof adjustAccountSchema>;

export function Clients() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateClientRequest; file?: File }) =>
      clientsApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateClientRequest>; file?: File }) =>
      clientsApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsEditModalOpen(false);
      setSelectedClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const adjustAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdjustAccountRequest }) =>
      clientsApi.adjustAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAdjustModalOpen(false);
      setSelectedClient(null);
    },
  });

  const {
    register: registerAdjust,
    handleSubmit: handleAdjustSubmit,
    formState: { errors: adjustErrors },
    reset: resetAdjustForm,
  } = useForm<AdjustAccountFormData>({
    resolver: yupResolver(adjustAccountSchema),
  });

  const onAdjustSubmit = (data: AdjustAccountFormData) => {
    if (selectedClient) {
      adjustAccountMutation.mutate({ id: selectedClient.id, data });
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleAdjustAccount = (client: Client) => {
    setSelectedClient(client);
    setIsAdjustModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(id);
    }
  };

  const getClientTypeColor = (type: ClientType) => {
    switch (type) {
      case 'ACTIVE': return 'badge-success';
      case 'PROSPECT': return 'badge-warning';
      case 'INACTIVE': return 'badge-gray';
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
    return <ErrorMessage message="Failed to load clients" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your client relationships and contracts</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Contract Duration</th>
                <th>Locked Amount</th>
                <th>Advance Amount</th>
                <th>Due Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients?.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="font-medium">
                    <Link to={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </td>
                  <td>{client.email}</td>
                  <td>
                    <span className={`badge ${getClientTypeColor(client.type)}`}>
                      {client.type}
                    </span>
                  </td>
                  <td>{client.contractDurationDays} days</td>
                  <td>{formatCurrency(client.lockedAmountNrs)}</td>
                  <td>{formatCurrency(client.advanceAmountNrs)}</td>
                  <td>{formatCurrency(client.dueAmountNrs)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAdjustAccount(client)}
                        className="text-success-600 hover:text-success-700"
                        title="Adjust Account"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
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
          {clients?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No clients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Client"
        size="lg"
      >
        <ClientForm 
          mode="create"
          onSubmit={(data, file) => createMutation.mutate({ data, file })}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client"
        size="lg"
      >
        <ClientForm 
          mode="edit"
          client={selectedClient}
          onSubmit={(data, file) => updateMutation.mutate({ 
            id: selectedClient!.id, 
            data, 
            file 
          })}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Adjust Account Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Account - ${selectedClient?.name}`}
      >
        <form onSubmit={handleAdjustSubmit(onAdjustSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Locked Amount</label>
              <input {...registerAdjust('lockedDelta')} type="number" className="input mt-1" placeholder="0" />
              <p className="text-xs text-gray-500 mt-1">Positive to add, negative to subtract</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Advance Amount</label>
              <input {...registerAdjust('advanceDelta')} type="number" className="input mt-1" placeholder="0" />
              <p className="text-xs text-gray-500 mt-1">Positive to add, negative to subtract</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustAccountMutation.isPending}
              className="btn-primary"
            >
              {adjustAccountMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adjusting...
                </>
              ) : (
                'Adjust Account'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}