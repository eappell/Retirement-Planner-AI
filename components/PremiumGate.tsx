import React from 'react';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface PremiumGateProps {
  children: React.ReactNode;
  isAllowed: boolean;
  featureName?: string;
  message?: string;
  showUpgradeButton?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  isAllowed,
  featureName = 'This feature',
  message,
  showUpgradeButton = true,
}) => {
  if (isAllowed) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    // Send message to parent portal to navigate to upgrade page
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'NAVIGATE', path: '/upgrade' }, '*');
    }
  };

  return (
    <div className="relative p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center">
            <LockClosedIcon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Premium Feature
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {message || `${featureName} requires a Premium subscription to unlock advanced retirement planning tools.`}
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Premium includes:
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Advanced Monte Carlo simulations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                AI-powered retirement insights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Unlimited scenarios and projections
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                Export and save your plans
              </li>
            </ul>
          </div>
          {showUpgradeButton && (
            <button
              onClick={handleUpgrade}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
      
      {/* Blurred preview of the locked content */}
      <div className="mt-6 relative">
        <div className="absolute inset-0 backdrop-blur-md bg-white/50 dark:bg-gray-900/50 rounded z-10"></div>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>
    </div>
  );
};
