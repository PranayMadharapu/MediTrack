import React, { useState, useEffect } from 'react';
import { Medicine } from '../types';
import { Icons } from '../constants';

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicine: Medicine) => void;
  onDelete?: (id: string) => void;
  initialData?: Medicine | null;
}

const CATEGORIES = ['tablet', 'syrup', 'injection', 'other'] as const;

const MedicineModal: React.FC<MedicineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [formData, setFormData] = useState<Omit<Medicine, 'id'>>({
    name: '',
    dosage: '',
    time: '08:00',
    frequency: 'daily',
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    category: 'tablet',
  });

  useEffect(() => {
    if (initialData) {
      const { id: _id, ...rest } = initialData;
      setFormData(rest);
    } else {
      setFormData({
        name: '',
        dosage: '',
        time: '08:00',
        frequency: 'daily',
        instructions: '',
        startDate: new Date().toISOString().split('T')[0],
        category: 'tablet',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const medicine: Medicine = {
      ...formData,
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
    };
    onSave(medicine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <Icons.X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Medicine Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Aspirin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Dosage */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Dosage
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 500mg"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Time
              </label>
              <input
                required
                type="time"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                      formData.category === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Instructions
              </label>
              <textarea
                placeholder="e.g. Take after meals with plenty of water"
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                {initialData ? 'Update Medicine' : 'Save Medicine'}
              </button>
            </div>

            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id);
                  onClose();
                }}
                className="w-full px-4 py-3 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors border border-rose-100"
              >
                Remove Medicine
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineModal;
