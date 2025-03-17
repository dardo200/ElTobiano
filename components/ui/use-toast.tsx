import { toast as toastFunction, useToast } from "@/components/ui/toast/use-toast"

export const toast = {
  ...toastFunction,
  success: (message: string) => {
    toastFunction({
      title: "Éxito",
      description: message,
      variant: "default",
    })
  },
  error: (message: string) => {
    toastFunction({
      title: "Error",
      description: message,
      variant: "destructive",
    })
  },
  info: (message: string) => {
    toastFunction({
      title: "Información",
      description: message,
      variant: "default",
    })
  },
}

export { useToast }

