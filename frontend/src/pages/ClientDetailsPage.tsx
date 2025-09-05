import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Edit,
  FileText,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle,
} from "lucide-react";
import { clientsApi } from "../lib/api";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { formatDate } from "../utils/dateUtils";
import { Modal } from "../components/ui/Modal";
import { ClientForm } from "../components/ClientForm";
import type { CreateClientRequest } from "../types/api";

export function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: client,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientsApi.getById(Number(id)).then((res) => res.data.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateClientRequest>; file?: File }) =>
      clientsApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsEditModalOpen(false);
    },
  });

  // Calculate contract details
  const contractDetails = useMemo(() => {
    if (!client?.contractStartDate || !client?.contractDurationDays) return null;

    const startDate = new Date(client.contractStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + client.contractDurationDays);

    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
    const isExpired = today > endDate;

    return {
      startDate,
      endDate: endDate.toISOString(), // Convert to string
      daysRemaining,
      isExpired
    };
  }, [client?.contractStartDate, client?.contractDurationDays]);

  const contractUrl = useMemo(() => {
    if (!client?.contractPdfPath) {
      console.log('No contract PDF path found');
      return null;
    }

    // If the path already starts with http, use it as is (for absolute URLs)
    if (client.contractPdfPath.startsWith("http")) {
      return client.contractPdfPath;
    }

    // For relative paths, construct the full URL
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

    // Remove any leading slashes and 'uploads/' if it exists to avoid duplicates
    let cleanPath = client.contractPdfPath.replace(
      /^[\\/]*(uploads[\\/])?/,
      ""
    );

    const fullUrl = `${baseUrl}/uploads/${cleanPath}`;
    return fullUrl;
  }, [client?.contractPdfPath]);

  const handleDownloadContract = async () => {
    if (!contractUrl || !client?.name) return;

    try {
      // Fetch the file as a blob
      const response = await fetch(contractUrl);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = url;

      // Set the download attribute with a proper filename
      const formattedDate = new Date().toISOString().split("T")[0];
      const fileName = `contract-${client.name.replace(/\s+/g, "-").toLowerCase()}-${formattedDate}.pdf`;
      link.download = fileName;

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download the contract. Please try again.");
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
    return <ErrorMessage message="Failed to load client details" />;
  }

  if (!client) {
    return <ErrorMessage message="Client not found" />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="mr-2" size={20} /> Back to Clients
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditModalOpen(true)} 
              className="btn btn-primary"
            >
              <Edit size={16} className="mr-2" /> Edit Client
            </button>
            <button
              onClick={handleDownloadContract}
              disabled={!contractUrl}
              className={`btn ${contractUrl ? "btn-secondary" : "btn-disabled"}`}
            >
              <Download size={16} className="mr-2" /> Download Contract
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Client Information</h2>
              <div className="space-y-4 mt-4">
                <div className="flex items-start">
                  <User
                    className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                    size={18}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">
                      {client.contactPerson || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail
                    className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                    size={18}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${client.email}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
                {client.phone && (
                  <div className="flex items-start">
                    <Phone
                      className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${client.phone}`} className="font-medium">
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start">
                    <MapPin
                      className="text-gray-500 mt-1 mr-3 flex-shrink-0"
                      size={18}
                    />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{client.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Account Summary</h2>
              <div className="space-y-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`badge ${
                      client.type === "ACTIVE"
                        ? "badge-success"
                        : client.type === "PROSPECT"
                          ? "badge-warning"
                          : "badge-error"
                    }`}
                  >
                    {client.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Locked Amount</span>
                  <span className="font-medium">
                    NPR {client.lockedAmountNrs.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Advance Amount</span>
                  <span className="font-medium">
                    NPR {client.advanceAmountNrs.toLocaleString()}
                  </span>
                </div>
                <div className="divider my-2"></div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Balance</span>
                  <span
                    className={
                      client.lockedAmountNrs - client.advanceAmountNrs >= 0
                        ? "text-success"
                        : "text-error"
                    }
                  >
                    NPR{" "}
                    {(
                      client.lockedAmountNrs - client.advanceAmountNrs
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Right Column - Contract */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Contract Details</h2>
                <span className={`badge ${contractDetails?.isExpired ? 'badge-error' : 'badge-success'} gap-2`}>
                  <CheckCircle size={16} /> 
                  {contractDetails?.isExpired ? 'Expired' : 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {formatDate(client.contractStartDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {client.contractDurationDays} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">
                    {contractDetails ? formatDate(contractDetails.endDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Days Remaining</p>
                  <p className={`font-medium ${contractDetails?.isExpired ? 'text-error' : ''}`}>
                    {contractDetails ? 
                      (contractDetails.isExpired ? 'Expired' : `${contractDetails.daysRemaining} days`) 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {contractUrl ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Contract Document</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDownloadContract}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        Download
                      </button>
                      <button
                        onClick={() => window.open(contractUrl, '_blank')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View PDF
                      </button>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-hidden min-h-[500px] bg-gray-50 flex items-center justify-center">
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        PDF can be viewed in a new tab
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Click "View PDF" to open the document
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No contract uploaded
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload a contract to view it here
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(`/clients/edit/${client.id}`)}
                      className="btn btn-primary"
                    >
                      <Edit size={16} className="mr-2" /> Upload Contract
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client"
        size="lg"
      >
        <ClientForm 
          mode="edit"
          client={client}
          onSubmit={(data, file) => updateMutation.mutate({ 
            id: client.id, 
            data, 
            file 
          })}
          isLoading={updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
