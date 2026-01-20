import * as React from "react"

// Toast hook simples para não depender de bibliotecas externas
export const useToast = () => {
  const toast = ({ title, description }: { title: string; description?: string }) => {
    // Por enquanto, apenas um alert simples
    alert(`${title}${description ? '\n' + description : ''}`);
  };

  return { toast };
};