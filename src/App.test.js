import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, RotateCcw, User, Zap } from 'lucide-react';
import sdk from '@farcaster/frame-sdk';

// Add this near the top, after imports
const useFarcasterContext = () => {
  const [context, setContext] = useState(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
        const ctx = await sdk.context;
        setContext(ctx);
        setIsSDKLoaded(true);
      } catch (error) {
        console.log('Not running in Farcaster context');
        setIsSDKLoaded(true);
      }
    };
    load();
  }, []);

  return { context, isSDKLoaded };
};

// Rest of your constants...
const WORLD_SIZE = 3000;
// ... etc