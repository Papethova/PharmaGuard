import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--color-brand-blue)",
          "--normal-text": "var(--color-brand-yellow)",
          "--normal-border": "rgba(255, 255, 255, 0.2)",
          "--border-radius": "1rem",
          "--success-bg": "var(--color-brand-blue)",
          "--success-text": "var(--color-brand-yellow)",
          "--error-bg": "#ef4444",
          "--error-text": "white",
          "zIndex": 2147483647,
          "isolation": "isolate",
          "filter": "none",
          "backdropFilter": "none",
          "transform": "translate3d(0, 0, 99999px)",
          "WebkitTransform": "translate3d(0, 0, 99999px)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
