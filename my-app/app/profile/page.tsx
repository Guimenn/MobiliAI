"use client";

import { useState } from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileSidebar from "./_components/ProfileSidebar";
import ProfileAvatar from "./_components/ProfileAvatar";
import ProfileInfo from "./_components/ProfileInfo";
import { uploadUserAvatar } from "@/lib/supabase";
import { customerAPI } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAppStore();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
  };

  const handleSaveProfile = async (data: any) => {
    if (!user) {
      toast.error("Não foi possível identificar o usuário. Faça login novamente.");
      throw new Error("Usuário não encontrado");
    }

    const sanitize = (value?: string) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };

    const payload: Record<string, any> = {
      name: sanitize(data.name),
      phone: sanitize(data.phone),
      cpf: sanitize(data.cpf)?.replace(/\D/g, ""),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === "") {
        delete payload[key];
      }
    });

    if (Object.keys(payload).length === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }

    try {
      setIsSavingProfile(true);

      const updatedUser = await customerAPI.updateProfile(payload);

      const mergedUser = updatedUser
        ? { ...user, ...updatedUser }
        : { ...user, ...payload };

      setUser(mergedUser as typeof user);

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        (error as Error)?.message ||
        "Erro ao atualizar perfil.";
      toast.error(message);
      throw error;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) {
      toast.error("Selecione uma imagem antes de salvar.");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não identificado. Faça login novamente.");
      return;
    }

    try {
      setIsSavingAvatar(true);
      const uploadedUrl = await uploadUserAvatar(avatarFile, user.id);

      if (!uploadedUrl) {
        throw new Error("Não foi possível obter a URL do avatar.");
      }

      // Salvar avatarUrl no banco de dados
      const updatedUser = await customerAPI.updateProfile({ avatarUrl: uploadedUrl });

      // Atualizar estado local com os dados retornados do backend
      // Garantir que avatarUrl esteja presente - usar uploadedUrl como fallback
      const finalAvatarUrl = updatedUser?.avatarUrl || uploadedUrl;
      const mergedUser = {
        ...user,
        ...(updatedUser || {}),
        avatarUrl: finalAvatarUrl,
      };

      setUser(mergedUser as typeof user);

      toast.success("Avatar atualizado com sucesso!");
      setAvatarFile(null);
      
      // Retornar a URL do avatar para o componente ProfileAvatar atualizar o preview
      return finalAvatarUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar avatar.";
      toast.error(message);
      throw error;
    } finally {
      setIsSavingAvatar(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  const username = useMemo(() => user?.email?.split('@')[0] || 'usuario', [user?.email]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-300px)]">
          {/* Sidebar - Left */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content - Right */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Info Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Profile Info Form - Left */}
              <div className="xl:col-span-2 order-2 xl:order-1">
                <ProfileInfo
                  user={{
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone,
                    username: username,
                    cpf: (user as { cpf?: string } | null)?.cpf,
                  }}
                  onSave={handleSaveProfile}
                  isSaving={isSavingProfile}
                />
              </div>

              {/* Avatar Section - Right */}
              <div className="xl:col-span-1 order-1 xl:order-2">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <ProfileAvatar
                    avatarUrl={user?.avatarUrl}
                    username={username}
                    onAvatarChange={handleAvatarChange}
                    onAvatarSave={handleSaveAvatar}
                    onAvatarRemove={() => setAvatarFile(null)}
                    isSaving={isSavingAvatar}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
