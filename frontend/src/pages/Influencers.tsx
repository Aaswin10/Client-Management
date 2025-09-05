import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { influencersApi } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Plus, Edit, Trash2, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { 
  Influencer, 
  CreateInfluencerRequest, 
  SocialPlatform,
  CreateSocialHandleRequest 
} from '../types/api';

const influencerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  contactNumber: yup.string(),
  address: yup.string(),
  notes: yup.string(),
  isActive: yup.boolean(),
});

type InfluencerFormData = yup.InferType<typeof influencerSchema>;

export function Influencers() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [socialHandles, setSocialHandles] = useState<CreateSocialHandleRequest[]>([]);

  const { data: influencers, isLoading, error } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => influencersApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: influencersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
      setSocialHandles([]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateInfluencerRequest> }) =>
      influencersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      setIsEditModalOpen(false);
      setSelectedInfluencer(null);
      resetEditForm();
      setSocialHandles([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: influencersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreateForm,
  } = useForm<InfluencerFormData>({
    resolver: yupResolver(influencerSchema),
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
  } = useForm<InfluencerFormData>({
    resolver: yupResolver(influencerSchema),
  });

  const onCreateSubmit = (formData: InfluencerFormData) => {
    const data: CreateInfluencerRequest = {
      ...formData,
      socialHandles: socialHandles.length > 0 ? socialHandles : undefined,
    };
    createMutation.mutate(data);
  };

  const onEditSubmit = (formData: InfluencerFormData) => {
    if (selectedInfluencer) {
      const data: Partial<CreateInfluencerRequest> = {
        ...formData,
        socialHandles: socialHandles.length > 0 ? socialHandles : undefined,
      };
      updateMutation.mutate({ id: selectedInfluencer.id, data });
    }
  };

  const handleEdit = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setEditValue('name', influencer.name);
    setEditValue('email', influencer.email);
    setEditValue('contactNumber', influencer.contactNumber || '');
    setEditValue('address', influencer.address || '');
    setEditValue('notes', influencer.notes || '');
    setEditValue('isActive', influencer.isActive);
    setSocialHandles(influencer.socialHandles.map(handle => ({
      platform: handle.platform,
      handle: handle.handle,
      url: handle.url,
      followers: handle.followers,
      isVerified: handle.isVerified,
      isPrimary: handle.isPrimary,
    })));
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this influencer?')) {
      deleteMutation.mutate(id);
    }
  };

  const addSocialHandle = () => {
    setSocialHandles([...socialHandles, {
      platform: 'INSTAGRAM' as SocialPlatform,
      handle: '',
      isVerified: false,
      isPrimary: false,
    }]);
  };

  const updateSocialHandle = (index: number, field: string, value: any) => {
    const updated = [...socialHandles];
    updated[index] = { ...updated[index], [field]: value };
    setSocialHandles(updated);
  };

  const removeSocialHandle = (index: number) => {
    setSocialHandles(socialHandles.filter((_, i) => i !== index));
  };

  const filteredInfluencers = influencers?.filter(influencer =>
    influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    influencer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    influencer.socialHandles.some(handle => 
      handle.handle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'INSTAGRAM': return '📷';
      case 'FACEBOOK': return '📘';
      case 'YOUTUBE': return '📺';
      case 'TIKTOK': return '🎵';
      case 'TWITTER': return '🐦';
      case 'LINKEDIN': return '💼';
      default: return '🌐';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load influencers" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Influencers</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your influencer partnerships</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Influencer
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search influencers by name, email, or handle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Social Handles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInfluencers?.map((influencer) => (
                <tr key={influencer.id} className="hover:bg-gray-50">
                  <td className="font-medium">
                    <Link to={`/influencers/${influencer.id}`} className="hover:underline">
                      {influencer.name}
                    </Link>
                  </td>
                  <td>{influencer.email}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {influencer.socialHandles.slice(0, 3).map((handle, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100">
                          {getPlatformIcon(handle.platform)} {handle.handle}
                        </span>
                      ))}
                      {influencer.socialHandles.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{influencer.socialHandles.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${influencer.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {influencer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(influencer)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(influencer.id)}
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
          {filteredInfluencers?.length === 0 && (
            <div className="text-center py-8">
              <Star className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No influencers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSocialHandles([]);
        }}
        title="Add New Influencer"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input {...registerCreate('name')} className="input mt-1" />
              {createErrors.name && <ErrorMessage message={createErrors.name.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input {...registerCreate('email')} type="email" className="input mt-1" />
              {createErrors.email && <ErrorMessage message={createErrors.email.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input {...registerCreate('contactNumber')} className="input mt-1" />
            </div>
            <div className="flex items-center">
              <input {...registerCreate('isActive')} type="checkbox" className="h-4 w-4 text-primary-600 rounded" />
              <label className="ml-2 text-sm text-gray-700">Active</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea {...registerCreate('address')} className="input mt-1" rows={2} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea {...registerCreate('notes')} className="input mt-1" rows={3} />
          </div>

          {/* Social Handles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Social Media Handles</label>
              <button
                type="button"
                onClick={addSocialHandle}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                + Add Handle
              </button>
            </div>
            {socialHandles.map((handle, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2 p-3 border rounded-lg">
                <select
                  value={handle.platform}
                  onChange={(e) => updateSocialHandle(index, 'platform', e.target.value)}
                  className="input"
                >
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="TWITTER">Twitter</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </select>
                <input
                  type="text"
                  placeholder="Handle"
                  value={handle.handle}
                  onChange={(e) => updateSocialHandle(index, 'handle', e.target.value)}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Followers"
                  value={handle.followers || ''}
                  onChange={(e) => updateSocialHandle(index, 'followers', parseInt(e.target.value) || undefined)}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => removeSocialHandle(index)}
                  className="text-error-600 hover:text-error-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setSocialHandles([]);
              }}
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
                'Create Influencer'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInfluencer(null);
          setSocialHandles([]);
        }}
        title="Edit Influencer"
        size="lg"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input {...registerEdit('name')} className="input mt-1" />
              {editErrors.name && <ErrorMessage message={editErrors.name.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input {...registerEdit('email')} type="email" className="input mt-1" />
              {editErrors.email && <ErrorMessage message={editErrors.email.message!} className="mt-1" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input {...registerEdit('contactNumber')} className="input mt-1" />
            </div>
            <div className="flex items-center">
              <input {...registerEdit('isActive')} type="checkbox" className="h-4 w-4 text-primary-600 rounded" />
              <label className="ml-2 text-sm text-gray-700">Active</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea {...registerEdit('address')} className="input mt-1" rows={2} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea {...registerEdit('notes')} className="input mt-1" rows={3} />
          </div>

          {/* Social Handles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Social Media Handles</label>
              <button
                type="button"
                onClick={addSocialHandle}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                + Add Handle
              </button>
            </div>
            {socialHandles.map((handle, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2 p-3 border rounded-lg">
                <select
                  value={handle.platform}
                  onChange={(e) => updateSocialHandle(index, 'platform', e.target.value)}
                  className="input"
                >
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="TWITTER">Twitter</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </select>
                <input
                  type="text"
                  placeholder="Handle"
                  value={handle.handle}
                  onChange={(e) => updateSocialHandle(index, 'handle', e.target.value)}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Followers"
                  value={handle.followers || ''}
                  onChange={(e) => updateSocialHandle(index, 'followers', parseInt(e.target.value) || undefined)}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => removeSocialHandle(index)}
                  className="text-error-600 hover:text-error-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedInfluencer(null);
                setSocialHandles([]);
              }}
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
                'Update Influencer'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}