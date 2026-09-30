"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { X, AlertCircle } from "lucide-react";

interface LeadIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLeadId: string) => void;
}

const PRESET_LEADS = [
  {
    title: "Gurugram 3.5 BHK (High intent)",
    data: {
      name: "Aditya Vardhan Birla",
      phone: "+919811234567",
      location: "Gurugram, Golf Course Extension Road",
      propertyRequirement: "3.5 BHK Luxury High-rise",
      budget: "₹3.4 Cr - ₹3.8 Cr",
      buyingTimeline: "Immediate (within 20 days)",
      customerMessage: "Looking for ready-to-move or nearing possession 3.5 BHK on Golf Course Ext Rd. Need 2 car parkings, park facing, middle to high floor. HDFC home loan already sanctioned for ₹2.5 Cr. Can visit this Saturday morning.",
    },
  },
  {
    title: "Sohna Road (Hinglish)",
    data: {
      name: "Manish Chawla",
      phone: "+919871122334",
      location: "Gurugram, Sohna Road / SPR",
      propertyRequirement: "3 BHK Gated Society",
      budget: "₹1.7 Cr - ₹1.9 Cr",
      buyingTimeline: "Within 2 months",
      customerMessage: "Bhai 3BHK chahiye near Golf Course Ext or Sohna Road. Family shift karni hai. Budget max 1.85 Cr tak stretch kar sakte hain agar builder reputed ho. Possession 6 months me mil sakti hai kya? Pehle WhatsApp par brochure bhej do.",
    },
  },
  {
    title: "Bengaluru Villa (NRI relocation)",
    data: {
      name: "Siddharth & Meera Nair",
      phone: "+919845123456",
      location: "Bengaluru, Whitefield / Hope Farm",
      propertyRequirement: "4 BHK Gated Villa",
      budget: "₹4.5 Cr - ₹5.0 Cr",
      buyingTimeline: "Next 30 days",
      customerMessage: "Relocating from Dubai to Bengaluru for VP engineering role near ITPL. Need standalone gated villa with private terrace and EV charger provision. In Bengaluru next week to finalize advance booking.",
    },
  },
];

export function LeadIntakeModal({ isOpen, onClose, onSuccess }: LeadIntakeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "Gurugram, Golf Course Ext Road",
    propertyRequirement: "3 BHK High-rise Apartment",
    budget: "₹2.5 Cr - ₹3.0 Cr",
    buyingTimeline: "Within 30-45 days",
    customerMessage: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (!isOpen) return null;

  const loadPreset = (preset: (typeof PRESET_LEADS)[0]["data"]) => {
    setFormData(preset);
    setFieldErrors({});
    setErrorMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[e.target.name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep(1);
    setErrorMessage(null);
    setFieldErrors({});

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 500);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 1000);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        throw new Error(data.message || data.error || "Failed to process lead");
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      onSuccess(data.lead.id);
      onClose();
    } catch (err: unknown) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setErrorMessage((err as Error).message || "Could not analyze lead. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative w-full max-w-xl rounded-sm bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">New Inbound Lead</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter customer requirement and message to generate analysis and priority score.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sample lead loader */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-medium shrink-0">Sample lead:</span>
            {PRESET_LEADS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(p.data)}
                className="whitespace-nowrap px-2 py-0.5 rounded-sm text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 shrink-0">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold">Unable to process lead</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Customer full name"
                className="w-full rounded-sm border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none"
              />
              {fieldErrors.name && <p className="text-xs text-rose-600 mt-0.5">{fieldErrors.name[0]}</p>}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98112 33445"
                className="w-full rounded-sm border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Gurugram, Golf Course Ext Road"
                className="w-full rounded-sm border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none"
              />
              {fieldErrors.location && <p className="text-xs text-rose-600 mt-0.5">{fieldErrors.location[0]}</p>}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Property requirement <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="propertyRequirement"
                required
                value={formData.propertyRequirement}
                onChange={handleChange}
                placeholder="e.g. 3.5 BHK High-rise Apartment"
                className="w-full rounded-sm border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none"
              />
              {fieldErrors.propertyRequirement && (
                <p className="text-xs text-rose-600 mt-0.5">{fieldErrors.propertyRequirement[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Budget <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="budget"
                required
                value={formData.budget}
                onChange={handleChange}
                placeholder="e.g. ₹3.2 Cr - ₹3.6 Cr"
                className="w-full rounded-sm border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none"
              />
              {fieldErrors.budget && <p className="text-xs text-rose-600 mt-0.5">{fieldErrors.budget[0]}</p>}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Buying timeline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="buyingTimeline"
                required
                value={formData.buyingTimeline}
                onChange={handleChange}
                placeholder="e.g. Immediate / Within 30 days"
                className="w-full rounded-sm border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none"
              />
              {fieldErrors.buyingTimeline && (
                <p className="text-xs text-rose-600 mt-0.5">{fieldErrors.buyingTimeline[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Customer message <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="customerMessage"
              rows={4}
              required
              value={formData.customerMessage}
              onChange={handleChange}
              placeholder="Paste WhatsApp message, inquiry form text, or phone notes (Hinglish supported)..."
              className="w-full rounded-sm border border-slate-300 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none"
            />
            {fieldErrors.customerMessage && (
              <p className="text-xs text-rose-600 mt-0.5">{fieldErrors.customerMessage[0]}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Transcripts over 4,000 characters are safely trimmed.
            </p>
          </div>

          {/* Loading status */}
          {isLoading && (
            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-800 border-r-transparent" />
                <span>Analyzing lead details...</span>
              </div>
              <p className="text-xs text-slate-500 pl-5">
                {loadingStep === 1 && "Extracting requirements and timeline..."}
                {loadingStep === 2 && "Checking budget against local market..."}
                {loadingStep >= 3 && "Computing score and saving..."}
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} disabled={!formData.name || !formData.customerMessage}>
              {isLoading ? "Saving..." : "Analyze lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
