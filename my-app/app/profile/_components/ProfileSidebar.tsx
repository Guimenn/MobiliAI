"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  CreditCard, 
  MapPin, 
  Lock, 
  Cookie, 
  Shield,
  Bell,
  Ticket,
  Coins,
  ShoppingBag,
  Heart,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems = {
  minhaConta: [
    { label: "Perfil", href: "/profile", icon: User },
    { label: "Cartões / Contas Bancárias", href: "/profile/cards", icon: CreditCard },
    { label: "Endereços", href: "/profile/addresses", icon: MapPin },
    { label: "Trocar Senha", href: "/profile/password", icon: Lock },
  ],
  minhasCompras: [
    { label: "Meus Cupons", href: "/profile/coupons", icon: Ticket },

    { label: "Meus Pedidos", href: "/customer/orders", icon: ShoppingBag },
    { label: "Meus Favoritos", href: "/favorites", icon: Heart },
  ],
};

export default function ProfileSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/profile") {
      return pathname === "/profile";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full h-full ">
      {/* Minha Conta */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <User className="h-4 w-4 text-[#3e2626]" />
          <h3 className="text-sm font-semibold text-gray-900">Minha Conta</h3>
        </div>
        <nav className="space-y-1">
          {menuItems.minhaConta.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-[#3e2626] text-white font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#3e2626]"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Minhas Compras */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Package className="h-4 w-4 text-[#3e2626]" />
          <h3 className="text-sm font-semibold text-gray-900">Minhas Compras</h3>
        </div>
        <nav className="space-y-1">
          {menuItems.minhasCompras.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-[#3e2626] text-white font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#3e2626]"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

