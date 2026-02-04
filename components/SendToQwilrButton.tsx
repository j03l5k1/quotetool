// components/SendToQwilrButton.tsx
'use client';

import { useState } from 'react';

interface SendToQwilrButtonProps {
  quoteData: any;
  disabled?: boolean;
  className?: string;
}

export default function SendToQwilrButton({ 
  quoteData, 
  disabled = false,
  className = '' 
}: SendToQwilrButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendToQwilr = async () => {
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/send-to-qwilr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send quote');
      }

      setStatus('success');
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error sending to Qwilr:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // Reset error state after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Sending...';
    if (status === 'success') return '✓ Sent to Qwilr!';
    if (status === 'error') return '✗ Failed';
    return 'Send to Qwilr';
  };

  const getButtonClass = () => {
    const baseClass = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 ';
    
    if (disabled || loading) {
      return baseClass + 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    if (status === 'success') {
      return baseClass + 'bg-green-600 text-white';
    }
    
    if (status === 'error') {
      return baseClass + 'bg-red-600 text-white';
    }
    
    return baseClass + 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 ' + className;
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSendToQwilr}
        disabled={disabled || loading}
        className={getButtonClass()}
      >
        {getButtonText()}
      </button>
      
      {errorMessage && (
        <p className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
