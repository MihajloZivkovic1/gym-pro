'use client';

import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemType?: string;
  description?: string;
  isDeleting: boolean;
  warningMessage?: string;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Potvrda brisanja",
  itemName,
  itemType = "stavku",
  description,
  isDeleting,
  warningMessage
}: DeleteModalProps) {
  if (!isOpen) return null;

  const defaultDescription = `Da li ste sigurni da želite da obrišete ${itemType}:`;
  const defaultWarning = `Ova akcija će trajno obrisati ${itemType} i sve povezane podatke. Ova akcija se ne može poništiti.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            {description || defaultDescription}
          </p>
          <p className="font-semibold text-gray-900 mb-4">
            {itemName}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">
              <strong>Upozorenje:</strong> {warningMessage || defaultWarning}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Otkaži
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Brisanje...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Obriši
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}