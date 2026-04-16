'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, ChevronRight, Check } from 'lucide-react';

const steps = [
  { id: 1, title: 'Agency Profile', description: 'Set up your agency details.' },
  { id: 2, title: 'Insurers', description: 'Add your first insurer partner.' },
  { id: 3, title: 'First Client', description: 'Register your first client.' },
  { id: 4, title: 'Issue Policy', description: 'Link a policy.' },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
    else setIsCompleted(true);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-border mt-10 min-h-[50vh]">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
          <Check size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm">
          Your agency is configured. You can now start managing your clients and track renewals automatically.
        </p>
        <Link href="/dashboard" className="bg-primary text-white px-8 py-3 rounded-md font-medium text-sm">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to InsureFlow!</h1>
        <p className="text-gray-500 text-sm mt-1">Let&apos;s get your agency configured in just 4 simple steps.</p>
      </div>

      {/* Progress Tracker Pipeline - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row justify-between mb-8 pb-8 border-b border-border gap-4 sm:gap-0">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isPast = step.id < currentStep;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col sm:items-center text-left sm:text-center shrink-0">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium mb-2 ${
                    isPast
                      ? 'bg-primary border-primary text-white'
                      : isActive
                      ? 'border-primary text-primary'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {isPast ? <CircleCheck size={16} /> : step.id}
                </div>
                <div>
                  <div className="text-sm font-semibold whitespace-nowrap">{step.title}</div>
                  <div className="text-xs text-gray-500 hidden sm:block w-32">{step.description}</div>
                </div>
              </div>
              {step.id < 4 && (
                <div className="hidden sm:block w-full px-4">
                  <div className={`h-0.5 w-full ${isPast ? 'bg-primary' : 'bg-gray-200'}`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm p-6 sm:p-10">
        
        {/* Mock Forms Based on Step */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4">Agency Profile Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Agency Name</label>
                <input type="text" className="p-2 border rounded-md" placeholder="e.g. Apex Insurance Brokers" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">IRDA License Number</label>
                <input type="text" className="p-2 border rounded-md" placeholder="IRDA/123456" />
              </div>
              <div className="flex flex-col space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Primary Contact Email</label>
                <input type="email" className="p-2 border rounded-md" placeholder="contact@apex.com" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4">Select Primary Insurer</h3>
            <p className="text-sm text-gray-500 mb-4">Who do you write policies for mostly?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {['LIC of India', 'HDFC Life', 'Star Health'].map(ins => (
                 <div key={ins} className="border p-4 rounded-lg flex items-center space-x-3 cursor-pointer hover:border-primary">
                    <input type="radio" name="insurer" className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{ins}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4">Client Registration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Full Name</label>
                <input type="text" className="p-2 border rounded-md" placeholder="John Doe" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Mobile Number</label>
                <input type="text" className="p-2 border rounded-md" placeholder="+91 9876543210" />
              </div>
              <div className="flex flex-col space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">PAN Number</label>
                <input type="text" className="p-2 border rounded-md" placeholder="ABCDE1234F" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-semibold mb-4">Issue First Policy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Policy Type</label>
                <select className="p-2 border rounded-md">
                  <option>Term Life</option>
                  <option>Health Insurance</option>
                  <option>Motor / Vehicle</option>
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Premium Amount (₹)</label>
                <input type="number" className="p-2 border rounded-md" placeholder="15000" />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-8 border-t border-border flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-md font-medium text-sm border ${currentStep === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium text-sm transition"
          >
            <span>{currentStep === 4 ? 'Complete Setup' : 'Next Step'}</span>
            {currentStep < 4 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
