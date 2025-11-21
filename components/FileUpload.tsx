import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  label: string;
  stepPrefix?: string;
  subLabel?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  stepPrefix,
  subLabel,
  file,
  onFileChange,
  required = false,
  accept = "image/*"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = (selectedFile: File) => {
    onFileChange(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full group">
      <div className="flex items-baseline justify-between mb-2">
        <label className="block text-xs uppercase tracking-[0.15em] font-bold">
          {stepPrefix && <span className="mr-2 opacity-50">{stepPrefix}</span>}
          {label} {required && <span className="text-black">*</span>}
        </label>
        {subLabel && <span className="text-[10px] uppercase tracking-wider text-gray-500">{subLabel}</span>}
      </div>
      
      <div
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center w-full h-40
          border border-black cursor-pointer transition-all duration-200
          ${file 
            ? 'bg-white' 
            : 'bg-transparent hover:bg-black hover:text-white'}
        `}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />

        {file && previewUrl ? (
          <div className="relative w-full h-full p-1">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute top-2 right-2">
               <button
                onClick={handleClear}
                className="bg-black text-white p-1 hover:bg-white hover:text-black border border-black transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-[10px] p-1 font-mono truncate uppercase">
              {file.name}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <Upload size={20} strokeWidth={1.5} />
            <span className="text-xs uppercase tracking-widest font-bold">Upload File</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;