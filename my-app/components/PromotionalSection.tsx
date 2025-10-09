'use client';

import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, Truck, Sofa, Shield, CheckCircle, Award, Zap, Heart, Users, Sparkles, ArrowRight, Clock, TrendingUp } from 'lucide-react';

interface PromotionalSectionProps {
  className?: string;
}

export default function PromotionalSection({ className = '' }: PromotionalSectionProps) {
  return (
    <div className={`relative bg-white py-12 px-4 overflow-hidden ${className}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3e2626] to-transparent"></div>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Seção do Produto (Esquerda) */}
          <div className="relative">
            {/* Main Product Card */}
            <div className="relative group">
              {/* Product Image Container */}
              <div className="relative bg-gradient-to-br from-[#2c1810] via-[#3e2626] to-[#2c1810] rounded-2xl p-8 shadow-xl overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>
                
                {/* Sofá Illustration */}
                <div className="relative z-10 flex items-center justify-center mb-6">
                  <div className="relative">
                    {/* Sofá Structure */}
                    <div className="relative">
                      {/* Base */}
                      <div className="w-40 h-24 bg-gradient-to-br from-[#654321] via-[#8B4513] to-[#654321] rounded-2xl shadow-lg relative">
                        {/* Sofá Back */}
                        <div className="absolute -top-6 left-3 w-34 h-16 bg-gradient-to-br from-[#654321] via-[#8B4513] to-[#654321] rounded-t-2xl shadow-md"></div>
                        
                        {/* Cushions */}
                        <div className="absolute top-2 left-4 w-10 h-8 bg-gradient-to-br from-[#D2B48C] to-[#CD853F] rounded-lg shadow-sm"></div>
                        <div className="absolute top-2 left-16 w-10 h-8 bg-gradient-to-br from-[#DEB887] to-[#D2691E] rounded-lg shadow-sm"></div>
                        <div className="absolute top-2 right-4 w-10 h-8 bg-gradient-to-br from-[#F4A460] to-[#CD853F] rounded-lg shadow-sm"></div>
                        
                        {/* Arms */}
                        <div className="absolute top-3 -left-2 w-4 h-20 bg-gradient-to-br from-[#654321] to-[#8B4513] rounded-l-xl shadow-md"></div>
                        <div className="absolute top-3 -right-2 w-4 h-20 bg-gradient-to-br from-[#654321] to-[#8B4513] rounded-r-xl shadow-md"></div>
                      </div>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-4 -right-4 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-md opacity-90"></div>
                    <div className="absolute -bottom-2 -left-4 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-sm opacity-80"></div>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                    <TrendingUp className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="text-yellow-400 font-semibold text-xs">Mais Vendido</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    Sofá Premium 3 Lugares
                  </h3>
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">
                    Conforto excepcional e design elegante
                  </p>
                  
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <span className="text-2xl font-bold text-white">R$ 2.499</span>
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-white/60 line-through">R$ 3.299</span>
                      <span className="text-xs text-green-400 font-semibold">Economia R$ 800</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1">
                    <div className="flex space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-white/80 text-xs">4.9 (234)</span>
                  </div>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
              </div>

              {/* Discount Badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg transform rotate-12">
                <div className="text-center">
                  <div className="text-sm font-bold">-25%</div>
                  <div className="text-xs">OFF</div>
                </div>
              </div>

              {/* Feature Indicators */}
              <div className="absolute -top-4 left-4 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800">Conforto</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -left-8 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Award className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800">Premium</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 right-4 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800">Fácil</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Ofertas (Direita) */}
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-gradient-to-r from-[#3e2626] to-[#8B4513] text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Clock className="w-3 h-3 mr-1" />
                Oferta limitada
              </div>
              
              <h2 className="text-3xl font-bold text-[#3e2626] mb-3 leading-tight">
                <span className="block">Ofertas</span>
                <span className="block bg-gradient-to-r from-[#3e2626] to-[#8B4513] bg-clip-text text-transparent">Especiais</span>
              </h2>
              
              <p className="text-base text-gray-600 leading-relaxed max-w-sm">
                As melhores ofertas em móveis premium para seu lar.
              </p>
            </div>

            {/* Offers - Apenas 2 principais */}
            <div className="space-y-3">
              {/* Oferta 1 - Pacote Sala Completa */}
              <div className="group relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                      <Sofa className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">Pacote Sala Completa</h3>
                      <p className="text-gray-600 text-sm">
                        <span className="font-bold text-green-600">35% OFF</span> - Sofá + Mesa + 2 Poltronas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#3e2626] block">R$ 4.999</span>
                    <span className="text-sm text-gray-500 line-through">R$ 7.699</span>
                  </div>
                </div>
              </div>

              {/* Oferta 2 - Frete Grátis */}
              <div className="group relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">Frete Grátis Nacional</h3>
                      <p className="text-gray-600 text-sm">
                        Para pedidos acima de <span className="font-bold text-green-600">R$ 800</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600 block">GRÁTIS</span>
                    <span className="text-sm text-gray-500">Todo o Brasil</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#2a1f1f] hover:to-[#654321] text-white px-6 py-2 rounded-lg font-bold text-base shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 group">
                <Sofa className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>Ver Coleção Completa</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button variant="outline" className="border-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-6 py-2 rounded-lg font-bold text-base transition-all duration-300 flex items-center justify-center space-x-2 group">
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>Visualizar com IA</span>
              </Button>
            </div>

            {/* Guarantee Badge */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Garantia Total</h4>
                  <p className="text-gray-600 text-xs">
                    90 dias para troca, 2 anos de garantia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
