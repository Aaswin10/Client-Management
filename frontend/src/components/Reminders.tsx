import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { remindersApi, clientsApi, staffApi } from '../lib/api';
import { Modal } from './ui/Modal';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { 
  AdminReminder, 
  CreateReminderRequest, 
  ReminderType as ReminderTypeEnum, 
  ReminderPriority as ReminderPriorityEnum 
} from '../types/api';

// Validation schema for reminders
const reminderSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().notRequired(),
  type: yup.mixed<ReminderTypeEnum>().oneOf(Object.values(ReminderTypeEnum)).required('Type is required'),
  priority: yup.mixed<ReminderPriorityEnum>()
    .oneOf(Object.values(ReminderPriorityEnum))
    .notRequired(),
  dueDate: yup.date().required('Due date is required'),
  clientId: yup.lazy(val => 
    val === '' ? yup.mixed().notRequired() : yup.number().notRequired()
  ),
  staffId: yup.lazy(val => 
    val === '' ? yup.mixed().notRequired() : yup.number().notRequired()
  ),
}).required();

type ReminderFormData = yup.InferType<typeof reminderSchema>;

export function Reminders() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<AdminReminder | null>(null);

  // Fetch active reminders
  const { 
    data: reminders, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersApi.getActive().then(res => res.data.data),
  });

  // Fetch clients and staff for dropdown options
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then(res => res.data.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateReminderRequest) => remindersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateReminderRequest> }) => 
      remindersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setIsEditModalOpen(false);
      setSelectedReminder(null);
      resetEditForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remindersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => remindersApi.markAsCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  // Form handling for create and edit
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<ReminderFormData>({
    resolver: yupResolver(reminderSchema),
    defaultValues: {
      type: ReminderTypeEnum.GENERAL,
      priority: ReminderPriorityEnum.MEDIUM,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEditForm,
    setValue: setEditValue,
  } = useForm<ReminderFormData>({
    resolver: yupResolver(reminderSchema),
  });

  // Submit handlers
  const onCreateSubmit = (formData: ReminderFormData) => {
    const data: CreateReminderRequest = {
      ...formData,
      dueDate: formData.dueDate.toISOString(),
      clientId: formData.clientId === '' ? undefined : Number(formData.clientId),
      staffId: formData.staffId === '' ? undefined : Number(formData.staffId),
      description: formData.description || undefined,
      priority: formData.priority || ReminderPriorityEnum.MEDIUM,
    };
    createMutation.mutate(data);
  };

  const onEditSubmit = (formData: ReminderFormData) => {
    if (selectedReminder) {
      const data: Partial<CreateReminderRequest> = {
        ...formData,
        dueDate: formData.dueDate.toISOString(),
        clientId: formData.clientId === '' ? undefined : Number(formData.clientId),
        staffId: formData.staffId === '' ? undefined : Number(formData.staffId),
        description: formData.description || undefined,
        priority: formData.priority || ReminderPriorityEnum.MEDIUM,
      };
      updateMutation.mutate({ id: selectedReminder.id, data });
    }
  };

  // Handle edit of a reminder
  const handleEdit = (reminder: AdminReminder) => {
    setSelectedReminder(reminder);
    setEditValue('title', reminder.title);
    setEditValue('description', reminder.description || '');
    setEditValue('type', reminder.type);
    setEditValue('priority', reminder.priority);
    setEditValue('dueDate', new Date(reminder.dueDate));
    setEditValue('clientId', reminder.clientId?.toString() || '');
    setEditValue('staffId', reminder.staffId?.toString() || '');
    setIsEditModalOpen(true);
  };

  // Handle delete of a reminder
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle marking reminder as completed
  const handleComplete = (id: number) => {
    completeMutation.mutate(id);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return <ErrorMessage message="Failed to load reminders" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your administrative reminders</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Related To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reminders?.map((reminder) => (
                <tr key={reminder.id} className="hover:bg-gray-50">
                  <td className="font-medium">{reminder.title}</td>
                  <td>
                    <span className={`badge ${
                      reminder.type === ReminderTypeEnum.CONTRACT_EXPIRY ? 'badge-warning' :
                      reminder.type === ReminderTypeEnum.STAFF_CONTRACT ? 'badge-info' :
                      reminder.type === ReminderTypeEnum.PAYMENT_DUE ? 'badge-error' :
                      'badge-gray'
                    }`}>
                      {reminder.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      reminder.priority === ReminderPriorityEnum.URGENT ? 'badge-error' :
                      reminder.priority === ReminderPriorityEnum.HIGH ? 'badge-warning' :
                      reminder.priority === ReminderPriorityEnum.MEDIUM ? 'badge-info' :
                      'badge-gray'
                    }`}>
                      {reminder.priority}
                    </span>
                  </td>
                  <td>{new Date(reminder.dueDate).toLocaleDateString()}</td>
                  <td>
                    {reminder.client?.name || reminder.staff?.name || 'N/A'}
                  </td>
                  <td>
                    <span className={`badge ${
                      reminder.isCompleted ? 'badge-success' : 'badge-warning'
                    }`}>
                      {reminder.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {!reminder.isCompleted && (
                        <button
                          onClick={() => handleComplete(reminder.id)}
                          className="text-success-600 hover:text-success-700"
                          title="Mark as Completed"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(reminder)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
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
          {reminders?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No reminders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Reminder Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Reminder"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input {...registerCreate('title')} className="input mt-1" />
              {createErrors.title && <ErrorMessage message={createErrors.title.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select {...registerCreate('type')} className="input mt-1">
                {Object.values(ReminderTypeEnum).map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {createErrors.type && <ErrorMessage message={createErrors.type.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select {...registerCreate('priority')} className="input mt-1">
                {Object.values(ReminderPriorityEnum).map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input 
                type="date" 
                {...registerCreate('dueDate')} 
                className="input mt-1" 
              />
              {createErrors.dueDate && <ErrorMessage message={createErrors.dueDate.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Related Client (Optional)</label>
              <select {...registerCreate('clientId')} className="input mt-1">
                <option value="">Select Client</option>
                {clients?.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Related Staff (Optional)</label>
              <select {...registerCreate('staffId')} className="input mt-1">
                <option value="">Select Staff</option>
                {staff?.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea 
              {...registerCreate('description')} 
              className="input mt-1" 
              rows={3}
            />
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
                'Create Reminder'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Reminder Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Reminder"
        size="lg"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input {...registerEdit('title')} className="input mt-1" />
              {editErrors.title && <ErrorMessage message={editErrors.title.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select {...registerEdit('type')} className="input mt-1">
                {Object.values(ReminderTypeEnum).map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {editErrors.type && <ErrorMessage message={editErrors.type.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select {...registerEdit('priority')} className="input mt-1">
                {Object.values(ReminderPriorityEnum).map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input 
                type="date" 
                {...registerEdit('dueDate')} 
                className="input mt-1" 
              />
              {editErrors.dueDate && <ErrorMessage message={editErrors.dueDate.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Related Client (Optional)</label>
              <select {...registerEdit('clientId')} className="input mt-1">
                <option value="">Select Client</option>
                {clients?.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Related Staff (Optional)</label>
              <select {...registerEdit('staffId')} className="input mt-1">
                <option value="">Select Staff</option>
                {staff?.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea 
              {...registerEdit('description')} 
              className="input mt-1" 
              rows={3}
            />
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
                'Update Reminder'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 