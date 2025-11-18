/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useRef } from 'react';
import axios from 'axios';

interface UploadProps {
  children: React.ReactNode;
  // 'image' or 'video' to set the accept attribute, but Cloudinary can handle 'auto' resource_type
  type: 'image' | 'video';
  setProgress: (progress: number) => void;
  setData: (data: any) => void;
}

const Upload: React.FC<UploadProps> = ({
  children,
  type,
  setProgress,
  setData,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];

      // Cloudinary unsigned upload endpoint
      const cloudName = 'dlttworg3';
      const uploadPreset = 'Verto_Preset';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

      // Form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset as string);
      // You could force "resource_type: 'image'" or "resource_type: 'video'"
      // but 'auto' usually works fine if you want Cloudinary to detect.
      // formData.append("resource_type", type === "video" ? "video" : "image");

      // POST using axios to handle progress
      const response = await axios.post(uploadUrl, formData, {
        onUploadProgress: (progressEvent:any) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        },
      });

      // Response includes many fields (public_id, secure_url, width, height, etc.)
      setData(response.data); // setData might store this in state for further usage
      console.log('Upload Success:', response.data);
    } catch (err) {
      console.error('Upload Error:', err);
    } finally {
      // Reset progress or do other housekeeping if needed
      setProgress(0);
    }
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        accept={`${type}/*`}
        onChange={handleFileChange}
      />

      {/* Clickable area that triggers the file input */}
      <div className="cursor-pointer" onClick={() => inputRef.current?.click()}>
        {children}
      </div>
    </div>
  );
};

export default Upload;
