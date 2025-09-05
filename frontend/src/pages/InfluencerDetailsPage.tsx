import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { influencersApi, collaborationsApi, paymentsApi } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../utils/dateUtils';
import type { 
  Influencer, 
  CreateInfluencerRequest, 
  CreateSocialHandleRequest,
  SocialPlatform 
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

export function InfluencerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [socialHandles, setSocialHandles] = useState<CreateSocialHandleRequest[]>([]);

  const {
    data: influencer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['influencer', id],
    queryFn: () => influencersApi.getById(Number(id)).then((res) => res.data.data),
    enabled: !!id,
  });

  const { data: influencerStats } = useQuery({
    queryKey: ['influencer-stats', id],
    queryFn: () => influencersApi.getStats(Number(id)).then((res) => res.data.data),
    enabled: !!id,
  });

  const { data: collaborations } = useQuery({
    queryKey: ['collaborations', id],
    queryFn: () => collaborationsApi.getByInfluencer(Number(id)).then((res) => res.data.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateInfluencerRequest> }) =>
      influencersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer', id] });
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      setIsEditModalOpen(false);
      setSocialHandles([]);
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    setValue: setEditValue,
  } = useForm<InfluencerFormData>({
    resolver: yupResolver(influencerSchema),
  });

  const onEditSubmit = (formData: InfluencerFormData) => {
    if (influencer) {
      const data: Partial<CreateInfluencerRequest> = {
        ...formData,
        socialHandles: socialHandles.length > 0 ? socialHandles : undefined,
      };
      updateMutation.mutate({ id: influencer.id, data });
    }
  };

  const handleEdit = () => {
    if (influencer) {
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'badge-success';
      case 'COMPLETED': return 'badge-gray';
      case 'CANCELLED': return 'badge-error';
      default: return 'badge-warning';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load influencer details" />;
  }

  if (!influencer) {
    return <ErrorMessage message="Influencer not found" />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2" size={20} /> Back to Influencers
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{influencer.name}</h1>
          <button 
            onClick={handleEdit} 
            className="btn btn-primary"
          >
            <Edit size={16} className="mr-2" /> Edit Influencer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Influencer Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Influencer Information</h2>
              <div className="space-y-4 mt-4">
                <div className="flex items-start">
                  <Mail
                    className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                    size={18}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${influencer.email}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {influencer.email}
                    </a>
                  </div>
                </div>
                {influencer.contactNumber && (
                  <div className="flex items-start">
                    <Phone
                      className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${influencer.contactNumber}`} className="font-medium">
                        {influencer.contactNumber}
                      </a>
                    </div>
                  </div>
                )}
                {influencer.address && (
                  <div className="flex items-start">
                    <MapPin
                      className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{influencer.address}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start">
                  <Star
                    className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                    size={18}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`badge ${influencer.isActive ? 'badge-success' : 'badge-gray'}`}
                    >
                      {influencer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Handles */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Social Media Handles</h2>
              <div className="space-y-3 mt-4">
                {influencer.socialHandles.map((handle, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getPlatformIcon(handle.platform)}</span>
                      <div>
                        <p className="font-medium">{handle.handle}</p>
                        <p className="text-sm text-gray-500">{handle.platform}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {handle.followers && (
                        <p className="text-sm font-medium">{handle.followers.toLocaleString()} followers</p>
                      )}
                      {handle.isVerified && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {influencer.socialHandles.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No social handles added</p>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          {influencerStats && (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Statistics</h2>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Collaborations</span>
                    <span className="font-medium">{influencerStats.stats.totalCollaborations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earnings</span>
                    <span className="font-medium text-success-600">
                      {formatCurrency(influencerStats.stats.totalEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Payments</span>
                    <span className="font-medium text-warning-600">
                      {formatCurrency(influencerStats.stats.pendingPayments)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overdue Payments</span>
                    <span className="font-medium text-error-600">
                      {formatCurrency(influencerStats.stats.overduePayments)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Collaborations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Collaborations</h2>
              
              {collaborations && collaborations.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {collaborations.map((collaboration) => (
                    <div key={collaboration.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{collaboration.campaignName}</h3>
                          {collaboration.description && (
                            <p className="text-gray-600 text-sm mt-1">{collaboration.description}</p>
                          )}
                        </div>
                        <span className={`badge ${getStatusColor(collaboration.status)}`}>
                          {collaboration.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-medium text-success-600">
                            {formatCurrency(collaboration.agreedAmountNrs)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">
                            {formatDate(collaboration.startDate)} - {formatDate(collaboration.endDate)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Deliverables</p>
                        <p className="text-sm mt-1">{collaboration.deliverables}</p>
                      </div>
                      
                      {collaboration.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">Notes</p>
                          <p className="text-sm mt-1">{collaboration.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No collaborations yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This influencer hasn't been assigned to any campaigns yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {influencer.notes && (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Notes</h2>
                <p className="mt-4 text-gray-700">{influencer.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
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
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
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