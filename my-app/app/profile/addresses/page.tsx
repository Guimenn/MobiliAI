"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileSidebar from "../_components/ProfileSidebar";
import { AddressSection } from "../_components/AddressSection";

export default function AddressesPage() {
  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar - Left */}
          <div className="lg:col-span-1 h-full">
            <ProfileSidebar />
          </div>

          {/* Main Content - Right */}
          <div className="lg:col-span-3">
            <AddressSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

