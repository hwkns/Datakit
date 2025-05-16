import React, { useState } from "react";
import { X, Globe, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import S3 from "@/assets/s3.png";
import GCS from "@/assets/gcs.png";

interface RemoteFileImportProps {
  onURLSubmit: (url: string, provider: "web" | "s3" | "gcs") => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const RemoteFileImport: React.FC<RemoteFileImportProps> = ({
  onURLSubmit,
  isLoading = false,
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<
    "web" | "s3" | "gcs"
  >("web");
  const [inputError, setInputError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form state
    setUrl("");
    setInputError(null);
  };

  const handleProviderSelect = (provider: "web" | "s3" | "gcs") => {
    setSelectedProvider(provider);
    setInputError(null);
  };

  const validateURL = (
    url: string,
    provider: "web" | "s3" | "gcs"
  ): boolean => {
    // Reset previous errors
    setInputError(null);

    // Basic URL validation
    if (!url.trim()) {
      setInputError("Please enter a URL");
      return false;
    }

    try {
      // Create URL object to validate format
      const urlObj = new URL(url);

      // Validate by provider
      if (provider === "web") {
        // HTTP/HTTPS protocol check
        if (!["http:", "https:"].includes(urlObj.protocol)) {
          setInputError("Web URLs must use HTTP or HTTPS protocol");
          return false;
        }
      } else if (provider === "s3") {
        // Basic S3 URL validation (s3:// or https://s3...)
        if (!url.includes("s3://") && !url.includes("amazonaws.com")) {
          setInputError("Please enter a valid S3 URL");
          return false;
        }
      } else if (provider === "gcs") {
        // Basic GCS URL validation
        if (!url.includes("storage.googleapis.com") && !url.includes("gs://")) {
          setInputError("Please enter a valid Google Cloud Storage URL");
          return false;
        }
      }

      return true;
    } catch (err) {
      setInputError("Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateURL(url, selectedProvider)) {
      try {
        await onURLSubmit(url, selectedProvider);
        // Close modal on success
        handleCloseModal();
      } catch (error) {
        // Error handling is expected to be done by the parent component
      }
    }
  };

  // Provider icons with labels
  const providers = [
    {
      id: "web" as const,
      icon: <Globe className="h-5 w-5" />,
      label: "Web URL",
      color: "text-blue-400",
    },
    {
      id: "s3" as const,
      icon: S3,
      label: "Amazon S3",
      color: "text-orange-400",
    },
    {
      id: "gcs" as const,
      icon: GCS,
      label: "Google Cloud",
      color: "text-green-400",
    },
  ];

  return (
    <>
      {/* Button to open modal */}
      <Button
        variant="outline"
        className="w-full bg-white/5 border border-white/20 hover:border-primary/80 hover:bg-black/30 transition-all mt-2"
        onClick={handleOpenModal}
        disabled={isLoading}
      >
        <div className="flex items-center justify-center w-full py-1">
          <span className="text-sm text-white/80">Bring from</span>
          <div className="flex items-center space-x-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`rounded p-1 transition-transform hover:scale-110 ${provider.color}`}
              >
                {provider.id !== "web" && (
                  <img
                    src={provider.icon}
                    alt={provider.id}
                    className="h-4 w-4"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </Button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-200">
          {/* Modal Content */}
          <div
            className="w-full max-w-md bg-darkNav border border-white/20 rounded-lg shadow-xl shadow-black/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-medium text-white">
                Import Remote Data File
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="h-8 w-8 p-0 rounded-full text-white/70 hover:text-white hover:bg-black/30"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Provider Selection Tabs */}
            <div className="flex items-center border-b border-white/10">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  className={cn(
                    "flex-1 py-3 px-3 text-sm font-medium transition-all flex items-center justify-center border-b-2",
                    selectedProvider === provider.id
                      ? `${provider.color} border-current`
                      : "text-white/50 border-transparent hover:text-white/70"
                  )}
                  onClick={() => handleProviderSelect(provider.id)}
                  disabled={isLoading}
                >
                  {provider.id === "web" ? (
                    provider.icon
                  ) : (
                    <img src={provider.icon} className="h-4 w-4" />
                  )}
                  <span className="ml-2">{provider.label}</span>
                </button>
              ))}
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label
                    htmlFor="remote-url"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    {selectedProvider === "web" &&
                      "Web URL to CSV or JSON file"}
                    {selectedProvider === "s3" && "S3 URL (public access only)"}
                    {selectedProvider === "gcs" && "Google Cloud Storage URL"}
                  </label>
                  <div className="relative">
                    <input
                      id="remote-url"
                      type="text"
                      placeholder={`Enter ${
                        selectedProvider === "web"
                          ? "https://"
                          : selectedProvider === "s3"
                          ? "s3://"
                          : "gs://"
                      }...`}
                      className={cn(
                        "w-full px-3 py-2 h-10 bg-black/30 border border-white/20 rounded text-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/40",
                        inputError &&
                          "border-destructive focus:ring-destructive"
                      )}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  {inputError && (
                    <p className="mt-1 text-xs text-destructive flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {inputError}
                    </p>
                  )}
                </div>

                {/* Example URLs */}
                <div className="text-xs text-white/60 bg-white/5 p-3 rounded">
                  <p className="font-medium mb-1.5 flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Example {selectedProvider.toUpperCase()} URLs:
                  </p>
                  {selectedProvider === "web" && (
                    <ul className="space-y-1 pl-4">
                      <li>https://example.com/data/file.csv</li>
                      <li>https://data.gov/datasets/sample.json</li>
                    </ul>
                  )}
                  {selectedProvider === "s3" && (
                    <ul className="space-y-1 pl-4">
                      <li>s3://bucket-name/path/to/file.csv</li>
                      <li>https://bucket-name.s3.amazonaws.com/file.json</li>
                    </ul>
                  )}
                  {selectedProvider === "gcs" && (
                    <ul className="space-y-1 pl-4">
                      <li>gs://bucket-name/path/to/file.csv</li>
                      <li>
                        https://storage.googleapis.com/bucket-name/file.json
                      </li>
                    </ul>
                  )}
                </div>

                {/* CORS warning for web URLs */}
                {selectedProvider === "web" && (
                  <div className="flex items-start text-xs text-amber-400/90 bg-amber-400/10 p-3 rounded border border-amber-400/20">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                    <p>
                      The remote server must allow cross-origin requests (CORS)
                      for browser access. Public data repositories and many APIs
                      support this, but some websites may block access.
                    </p>
                  </div>
                )}

                {/* Cloud provider notes */}
                {(selectedProvider === "s3" || selectedProvider === "gcs") && (
                  <div className="flex items-start text-xs text-blue-400/90 bg-blue-400/10 p-3 rounded border border-blue-400/20">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                    <p>
                      {selectedProvider === "s3"
                        ? "Only publicly accessible S3 buckets are supported currently. Credentials or private buckets are not supported in this version."
                        : "Only publicly accessible GCS buckets are supported currently. Authentication for private buckets is not supported in this version."}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer with action buttons */}
              <div className="border-t border-white/10 p-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="bg-transparent border-white/20"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !url.trim()}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Importing...
                    </>
                  ) : (
                    "Import Data"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default RemoteFileImport;
