"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader,
  OctagonXIcon,
  TriangleAlertIcon,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader className="size-4 animate-spin" />,
      }}
      closeButton
      position="bottom-right"
      duration={4000}
      visibleToasts={5}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--popover)",
          "--success-border": "#3e2626",
          "--success-text": "var(--popover-foreground)",
          "--error-bg": "var(--popover)",
          "--error-border": "var(--destructive)",
          "--error-text": "var(--popover-foreground)",
          "--warning-bg": "var(--popover)",
          "--warning-border": "oklch(0.828 0.189 84.429)",
          "--warning-text": "var(--popover-foreground)",
          "--info-bg": "var(--popover)",
          "--info-border": "var(--accent-foreground)",
          "--info-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      toastOptions={{
        className: "sonner-toast",
        style: {
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
