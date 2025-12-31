'use client';

import { useState } from "react";
import Image from "next/image";
import { Box, IconButton, Button, CircularProgress } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import SnackbarComponent from '@/@core/components/layouts/shared/Snackbar';
import { cdnServiceApi } from '@/servers/cnd-service';

interface BannerItem {
  id: number;
  imgsource: string;
  isdefault: string;
}

interface ViewBannerItemProps {
  input: any;
  onChangeValue: (bannerId: string) => void;
  dictionary: any;
  session: any;
}

export default function ViewBannerItem({
  input,
  onChangeValue,
  dictionary,
  session,
}: ViewBannerItemProps) {
  const banners: BannerItem[] = input.value ?? [];
  const defaultIndex = banners.findIndex((b) => b.isdefault === "true");
  const [currentIndex, setCurrentIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);
  const [editedImg, setEditedImg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  const [toastOpen, setToastOpen] = useState(false);

  const currentBanner = banners[currentIndex];

  // === Slide change
  const handleSlideChange = (newIndex: number) => {
    if (newIndex < 0) newIndex = banners.length - 1;
    if (newIndex >= banners.length) newIndex = 0;

    setEditedImg(null);
    setSelectedFile(null);
    setIsEditing(false);
    setCurrentIndex(newIndex);

    onChangeValue(banners[newIndex].id.toString());
  };

  // === Chọn ảnh mới
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      setEditedImg(imgUrl);
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  };

  // === Upload ảnh
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!session?.user?.token) return null;
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await cdnServiceApi.uploadFile({
        sessiontoken: session.user.token,
        file: formData,
        folderUpload: "banners"
      });

      const { status, data } = res;
      if (status !== 200 || !data?.fileUrl) {
        setToastMessage(data?.message || `Upload failed (${status})`);
        setToastSeverity('error');
        setToastOpen(true);
        return null;
      }

      setToastMessage('Upload successful');
      setToastSeverity('success');
      setToastOpen(true);
      return data.fileUrl;
    } catch (err) {
      console.error(err);
      setToastMessage('Unexpected error during upload');
      setToastSeverity('error');
      setToastOpen(true);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // === Confirm thay đổi ảnh
  const handleConfirm = async () => {
    if (!selectedFile) return;

    const uploadedUrl = await uploadImage(selectedFile);
    if (!uploadedUrl) return;

    // Cập nhật local banners
    banners[currentIndex] = {
      ...currentBanner,
      imgsource: uploadedUrl
    };

    setEditedImg(null);
    setSelectedFile(null);
    setIsEditing(false);

    // Callback lên parent
    onChangeValue(banners[currentIndex].id.toString());
  };

  const handleCloseToast = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setToastOpen(false);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2} width="100%">
      <Box
        position="relative"
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#000" }}
      >
        <Image
          src={editedImg ?? currentBanner.imgsource}
          alt="Banner"
          width={800}
          height={400}
          style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: "8px" }}
        />

        <IconButton
          onClick={() => handleSlideChange(currentIndex - 1)}
          sx={{ position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)" }}
        >
          <ArrowBackIos />
        </IconButton>

        <IconButton
          onClick={() => handleSlideChange(currentIndex + 1)}
          sx={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)" }}
        >
          <ArrowForwardIos />
        </IconButton>
      </Box>

      <Box>
        <input
          type="file"
          accept="image/*"
          id="banner-upload"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
        <label htmlFor="banner-upload">
          <Button variant="outlined" component="span">
            {isEditing ? "Chọn ảnh khác" : "Đổi ảnh"}
          </Button>
        </label>

        {isEditing && (
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirm}
            sx={{ ml: 2 }}
            disabled={isUploading}
          >
            {isUploading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        )}
      </Box>

      <Box display="flex" gap={1}>
        {banners.map((_, idx) => (
          <Box
            key={idx}
            width={10}
            height={10}
            borderRadius="50%"
            sx={{ backgroundColor: idx === currentIndex ? "green" : "#ccc", cursor: "pointer" }}
            onClick={() => handleSlideChange(idx)}
          />
        ))}
      </Box>

      <SnackbarComponent
        handleCloseToast={handleCloseToast}
        toastMessage={toastMessage}
        toastOpen={toastOpen}
        toastSeverity={toastSeverity}
      />
    </Box>
  );
}
