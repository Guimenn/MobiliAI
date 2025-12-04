"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileSidebar from "../_components/ProfileSidebar";
import { CreditCardSection } from "../_components/CreditCardSection";
import { VirtualDebitCardSection } from "../_components/VirtualDebitCardSection";
import { BankAccountSection } from "../_components/BankAccountSection";

export default function CardsPage() {
  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 sm:pb-20 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-300px)]">
          {/* Sidebar - Left */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content - Right */}
          <div className="lg:col-span-3 space-y-6">
            {/* Credit Card Section */}
            <CreditCardSection />

            {/* Virtual Debit Card Section */}
            <VirtualDebitCardSection />

            {/* Bank Account Section */}
            <BankAccountSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

