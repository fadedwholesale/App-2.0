import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckCircle, AlertTriangle, CreditCard, Lock } from 'lucide-react';
import { createPaymentIntent } from '../api/payment';

interface StripePaymentProps {
  amount: number;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent using our API
      const paymentIntent = await createPaymentIntent(Math.round(amount * 100));
      
      if (!paymentIntent) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm the payment with Stripe
      const { error: confirmError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (confirmedPayment.status === 'succeeded') {
        onPaymentSuccess(confirmedPayment);
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
        <div className="flex items-center space-x-2 text-green-600">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-semibold">Secure Payment</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Card Information</span>
            </div>
          </label>
          <div className="border border-gray-300 rounded-xl p-4 bg-white">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-6 py-4 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Pay ${amount.toFixed(2)}</span>
              </div>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Your payment is secured by Stripe. We never store your card information.
        </p>
      </div>
    </div>
  );
};

export default StripePayment;
