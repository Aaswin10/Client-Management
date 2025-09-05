import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import type { Client, CreateClientRequest, ClientType } from '../types/api';

const clientSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string(),
  address: yup.string(),
  contactPerson: yup.string(),
  contractStartDate: yup.string().required('Contract start date is required'),
  contractDurationDays: yup.number().positive('Duration must be positive').required('Duration is required'),
  type: yup.string().oneOf(['PROSPECT', 'ACTIVE', 'INACTIVE']),
  lockedAmountNrs: yup.number().min(0, 'Amount must be non-negative'),
  advanceAmountNrs: yup.number().min(0, 'Amount must be non-negative'),
});

type ClientFormData = yup.InferType<typeof clientSchema>;

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: CreateClientRequest, file?: File) => void;
  isLoading: boolean;
  mode: 'create' | 'edit';
}

export function ClientForm({ 
  client, 
  onSubmit, 
  isLoading, 
  mode 
}: ClientFormProps) {
  const [contractFile, setContractFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ClientFormData>({
    resolver: yupResolver(clientSchema),
    defaultValues: mode === 'create' 
      ? {
          type: 'PROSPECT' as ClientType,
          lockedAmountNrs: 0,
          advanceAmountNrs: 0,
        }
      : undefined,
  });

  // Populate form when editing an existing client
  useEffect(() => {
    if (mode === 'edit' && client) {
      setValue('name', client.name);
      setValue('email', client.email);
      setValue('phone', client.phone || '');
      setValue('address', client.address || '');
      setValue('contactPerson', client.contactPerson || '');
      setValue('contractStartDate', client.contractStartDate.split('T')[0]);
      setValue('contractDurationDays', client.contractDurationDays);
      setValue('type', client.type);
      setValue('lockedAmountNrs', client.lockedAmountNrs);
      setValue('advanceAmountNrs', client.advanceAmountNrs);
    }
  }, [client, mode, setValue]);

  const handleFormSubmit = (formData: ClientFormData) => {
    const data: CreateClientRequest = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      contactPerson: formData.contactPerson || undefined,
      contractStartDate: formData.contractStartDate,
      contractDurationDays: formData.contractDurationDays,
      type: formData.type as ClientType, 
      lockedAmountNrs: formData.lockedAmountNrs,
      advanceAmountNrs: formData.advanceAmountNrs,
    };

    onSubmit(data, contractFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input {...register('name')} className="input mt-1" />
          {errors.name && <ErrorMessage message={errors.name.message!} className="mt-1" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input {...register('email')} type="email" className="input mt-1" />
          {errors.email && <ErrorMessage message={errors.email.message!} className="mt-1" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input {...register('phone')} className="input mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Person</label>
          <input {...register('contactPerson')} className="input mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contract Start Date</label>
          <input {...register('contractStartDate')} type="date" className="input mt-1" />
          {errors.contractStartDate && <ErrorMessage message={errors.contractStartDate.message!} className="mt-1" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contract Duration (Days)</label>
          <input {...register('contractDurationDays')} type="number" className="input mt-1" />
          {errors.contractDurationDays && <ErrorMessage message={errors.contractDurationDays.message!} className="mt-1" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select {...register('type')} className="input mt-1">
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contract PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setContractFile(e.target.files?.[0] || null)}
            className="input mt-1"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <textarea {...register('address')} className="input mt-1" rows={3} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Locked Amount (NPR)</label>
          <input {...register('lockedAmountNrs')} type="number" className="input mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Advance Amount (NPR)</label>
          <input {...register('advanceAmountNrs')} type="number" className="input mt-1" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            mode === 'create' ? 'Create Client' : 'Update Client'
          )}
        </button>
      </div>
    </form>
  );
} 