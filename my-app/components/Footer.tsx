"use client";
import { Palette } from "lucide-react";
import { Facebook } from "lucide-react";
import { Instagram } from "lucide-react";
import { Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download } from "lucide-react";

export default function Footer() {
  return (
    // Footer
    <footer className="bg-gray-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
             <div className="w-12 h-12 bg-[#3e2626] rounded-lg flex items-center justify-center">
               <Palette className="h-6 w-6 text-white" />
             </div>
             <span className="text-2xl font-bold">MobiliAI</span>
           </div>
           <p className="text-gray-400 text-lg leading-relaxed">
             Transforme sua casa com móveis inteligentes e tecnologia de IA. 
             Visualize móveis reais antes de comprar.
           </p>
           <div className="flex space-x-4">
             <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white">
               <Facebook className="h-5 w-5" />
             </Button>
             <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white">
               <Instagram className="h-5 w-5" />
             </Button>
             <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white">
               <Twitter className="h-5 w-5" />
             </Button>
           </div>
         </div>

         <div>
           <h3 className="text-xl font-bold mb-6">Empresa</h3>
           <ul className="space-y-4 text-gray-400">
             <li><Link href="/about" className="hover:text-white transition-colors text-lg">Sobre Nós</Link></li>
             <li><Link href="/contact" className="hover:text-white transition-colors text-lg">Contato</Link></li>
             <li><Link href="/careers" className="hover:text-white transition-colors text-lg">Carreiras</Link></li>
             <li><Link href="/blog" className="hover:text-white transition-colors text-lg">Blog</Link></li>
           </ul>
         </div>

         <div>
           <h3 className="text-xl font-bold mb-6">Suporte</h3>
           <ul className="space-y-4 text-gray-400">
             <li><Link href="/help" className="hover:text-white transition-colors text-lg">Central de Ajuda</Link></li>
             <li><Link href="/shipping" className="hover:text-white transition-colors text-lg">Informações de Envio</Link></li>
             <li><Link href="/returns" className="hover:text-white transition-colors text-lg">Devoluções</Link></li>
             <li><Link href="/faq" className="hover:text-white transition-colors text-lg">FAQ</Link></li>
           </ul>
         </div>

         <div>
           <h3 className="text-xl font-bold mb-6">Baixe Nossa App</h3>
           <p className="text-gray-400 mb-6 text-lg">
             Disponível para iOS e Android
           </p>
           <div className="space-y-3">
             <Button variant="outline" className="w-full border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white text-lg py-3">
               <Download className="mr-3 h-5 w-5" />
               App Store
             </Button>
             <Button variant="outline" className="w-full border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white text-lg py-3">
               <Download className="mr-3 h-5 w-5" />
               Google Play
             </Button>
           </div>
         </div>
       </div>

       <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-400">
         <p className="text-lg">&copy; 2025 MobiliAI. Todos os direitos reservados.</p>
       </div>
     </div>
   </footer>
  );
}