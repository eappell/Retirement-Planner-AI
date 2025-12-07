# Premium Feature Implementation - Income Estimator

## Overview
The Income Estimator app now supports tier-based feature access using the portal's authentication system.

## What Was Implemented

### 1. **Authentication Hook** (`hooks/usePortalAuth.ts`)
- Listens for `AUTH_TOKEN` messages from the portal
- Provides user authentication state and tier information
- Exports helper functions: `isPremium`, `isAdmin`, `isFree`, `hasAccess()`

### 2. **Premium Gate Component** (`components/PremiumGate.tsx`)
- Reusable component that wraps premium features
- Shows upgrade prompt for free-tier users
- Displays blurred preview of locked content
- Integrates with portal's upgrade flow

### 3. **Protected Features**
The following features are now restricted to Premium/Admin users:

#### **AI-Powered Insights**
- Advanced AI analysis of retirement plans
- Personalized recommendations
- Risk assessment and optimization tips

#### **Monte Carlo Simulation**
- Stress-test plans against market volatility
- Probabilistic success rates
- Multiple scenario modeling

## How It Works

### For Free Users
1. User accesses app through portal with `tier: 'free'`
2. Premium features show upgrade prompt with:
   - Feature description
   - Benefits list
   - "Upgrade to Premium" button
   - Blurred preview of the feature
3. Clicking upgrade navigates to portal's `/upgrade` page

### For Premium/Admin Users
1. User accesses app with `tier: 'premium'` or `tier: 'admin'`
2. All features are fully accessible
3. No upgrade prompts shown

## Testing

### Test as Free User
```javascript
// In portal IFrameWrapper.tsx, the AUTH_TOKEN message includes:
{
  type: "AUTH_TOKEN",
  token: "...",
  userId: "...",
  email: "...",
  tier: "free"  // This determines access
}
```

### Test as Premium User
Change user tier in Firestore:
```javascript
// In Firebase Console -> Firestore -> users -> {userId}
{
  tier: "premium"  // or "admin"
}
```

## Usage in Other Components

To protect additional features:

```typescript
import { PremiumGate } from './components/PremiumGate';
import { usePortalAuth } from './hooks';

function MyComponent() {
  const { isPremium, isAdmin, isEmbedded } = usePortalAuth();
  
  return (
    <PremiumGate 
      isAllowed={isPremium || isAdmin}
      featureName="Advanced Export"
      message="Export your retirement plans to PDF with Premium"
      showUpgradeButton={isEmbedded}
    >
      <ExportButton />
    </PremiumGate>
  );
}
```

## Backend Verification (Recommended)

For sensitive operations, always verify on the server:

```typescript
// In your API endpoint
import { auth } from 'firebase-admin';

export const secureEndpoint = async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  try {
    const decodedToken = await auth().verifyIdToken(token);
    const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();
    const userTier = userDoc.data()?.tier;
    
    if (!['premium', 'admin'].includes(userTier)) {
      return res.status(403).json({ error: 'Premium subscription required' });
    }
    
    // Process the request...
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
```

## Next Steps

1. **Test the implementation** - Access the app through the portal and verify premium gates work
2. **Add more premium features** - Identify other features to gate
3. **Backend API protection** - Secure any API endpoints that should require premium access
4. **Analytics** - Track premium feature usage and upgrade conversions

## Files Modified

- `hooks/usePortalAuth.ts` - New authentication hook
- `hooks/index.ts` - Export new hook
- `components/PremiumGate.tsx` - New premium gate component
- `components/AnalysisSections.tsx` - Wrapped AI Insights and Monte Carlo with gates
- `App.tsx` - Added auth hook and passed premium flags to child components
