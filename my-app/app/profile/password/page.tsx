"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileSidebar from "../_components/ProfileSidebar";
import PasswordSection from "../_components/PasswordSection";

export default function PasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1 h-full">
            <ProfileSidebar />
          </div>

          <div className="lg:col-span-3">
            <PasswordSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

