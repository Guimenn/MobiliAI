"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileSidebar from "../_components/ProfileSidebar";
import PasswordSection from "../_components/PasswordSection";
import { authAPI, customerAPI } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export default function PasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleChangePassword = async (payload: { currentPassword: string; newPassword: string }) => {
    try {
      setIsSaving(true);
      if (user?.role?.toLowerCase() === "customer") {
        await customerAPI.changePassword(payload.currentPassword, payload.newPassword);
      } else {
        await authAPI.changePassword(payload.currentPassword, payload.newPassword);
      }
      toast.success("Senha atualizada com sucesso!");
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        (error as Error)?.message ||
        "Não foi possível atualizar a senha.";
      toast.error(message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-300px)]">
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          <div className="lg:col-span-3">
            <PasswordSection onSubmit={handleChangePassword} isLoading={isSaving} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

