import { createPortal } from 'react-dom';
import { Toaster } from 'sonner';

/**
 * Portal explícito a document.body con z-index forzado por encima de cualquier
 * modal (`fixed inset-0 z-[70]` es el más alto en la app). En móviles, index.css
 * reposiciona el toaster arriba de la pantalla vía [data-sonner-toaster].
 */
export default function AppToaster() {
  return createPortal(
    <Toaster richColors closeButton position="bottom-right" style={{ zIndex: 9999 }} />,
    document.body,
  );
}
