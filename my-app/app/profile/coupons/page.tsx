"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileSidebar from "../_components/ProfileSidebar";
import CouponSection from "../_components/CouponSection";

export default function CouponsPage() {
  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-300px)]">
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <CouponSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

