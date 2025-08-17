import React, { useState } from 'react';
import { FileUploadButton } from '@/components/common/FileUploadButton';
import { SourceTypeSelector } from './SourceTypeSelector';

import { File, Cloud } from 'lucide-react';
import s3Logo from '@/assets/s3.png';
import huggingfaceLogo from '@/assets/huggingface.png';
import motherDuckLogo from '@/assets/motherduck.png';
import googleDriveLogo from '@/assets/drive.svg';

export type SourceType = 'file' | 'cloud';

interface DataSourceManagerProps {
  /** Callback when files are selected (maintains compatibility) */
  onFileSelect?: (file: File) => void;
  /** Callback when file handle is selected (maintains compatibility) */
  onFileHandleSelect?: (handle: FileSystemFileHandle, file: File) => void;
  /** Callback when remote modal should open */
  onRemoteClick?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Custom className */
  className?: string;
}

export const DataSourceManager: React.FC<DataSourceManagerProps> = ({
  onFileSelect,
  onFileHandleSelect,
  onRemoteClick,
  isLoading = false,
  className = '',
}) => {
  const [activeSourceType, setActiveSourceType] = useState<SourceType>('file');

  const sourceTypes = [
    {
      type: 'file' as SourceType,
      label: 'Files',
      icon: File,
      description: 'Local files',
    },
    {
      type: 'cloud' as SourceType,
      label: 'Cloud',
      icon: Cloud,
      description: 'Remote data',
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Source Type Selector */}
      <SourceTypeSelector
        sourceTypes={sourceTypes}
        activeType={activeSourceType}
        onTypeSelect={setActiveSourceType}
      />

      {/* Source Type Panels */}
      <div className="min-h-[100px]">
        {activeSourceType === 'file' && (
          <FileUploadButton
            onFileSelect={onFileSelect}
            onFileHandleSelect={onFileHandleSelect}
            isLoading={isLoading}
            className="w-full"
          />
        )}

        {activeSourceType === 'cloud' && (
          <div className="flex items-center justify-center">
            <button
              onClick={onRemoteClick}
              className="group flex flex-col items-center justify-center py-6 px-4 rounded-lg bg-white/5 border border-white/15 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 w-full relative overflow-hidden cursor-pointer"
            >
              {/* Subtle gradient overlay on hover - consistent with SourceTypeSelector */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <h3 className="text-sm font-medium text-white mb-4 relative z-10 tracking-wide">
                Connect Cloud Sources
              </h3>

              {/* Provider logos - 4 smaller icons */}
              <div className="flex items-center gap-2 relative z-10">
                <img src={s3Logo} alt="S3" className="h-5 w-5 object-contain" />
                <img
                  src={motherDuckLogo}
                  alt="Motherduck"
                  className="h-10 w-10"
                />
                <img
                  src={huggingfaceLogo}
                  alt="Hugging Face"
                  className="h-5 w-5"
                />
                <img
                  src={googleDriveLogo}
                  alt="Google Drive"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
