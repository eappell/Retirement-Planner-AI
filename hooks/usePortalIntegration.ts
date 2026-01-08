import { useEffect, useState, useCallback } from 'react';

interface ToolbarButton {
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
  onClick: () => void;
}

export const usePortalIntegration = (buttons: ToolbarButton[]) => {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Detect if running in iframe
  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
  }, []);

  // Height reporting function
  const reportHeight = useCallback(() => {
    if (typeof window === 'undefined' || window.self === window.top) return;
    
    const body = document.body;
    const html = document.documentElement;
    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    window.parent.postMessage({ type: 'IFRAME_HEIGHT', height }, '*');
  }, []);

  // Report height to portal when embedded
  useEffect(() => {
    if (!isEmbedded) return;

    // (height reporting disabled to allow inner scrollbar)
    // const resizeObserver = new ResizeObserver(() => {
    //   reportHeight();
    // });
    // resizeObserver.observe(document.body);

    // Also handle REQUEST_CONTENT_HEIGHT from portal
    const handleContentHeightRequest = (event: MessageEvent) => {
      // if (event.data?.type === 'REQUEST_CONTENT_HEIGHT') {
      //   console.log('[usePortalIntegration] Received REQUEST_CONTENT_HEIGHT');
      //   reportHeight();
      // }
    };
    window.addEventListener('message', handleContentHeightRequest);

    return () => {
      // resizeObserver.disconnect();
      window.removeEventListener('message', handleContentHeightRequest);
    };
  }, [isEmbedded, reportHeight]);

  // Send toolbar buttons to portal
  useEffect(() => {
    if (!isEmbedded) return;

    const buttonConfigs = buttons.map(btn => ({
      id: btn.id,
      label: btn.label,
      icon: btn.icon,
      tooltip: btn.tooltip || btn.label,
    }));

    window.parent.postMessage(
      {
        type: 'TOOLBAR_BUTTONS',
        buttons: buttonConfigs,
      },
      '*'
    );
  }, [isEmbedded, buttons]);

  // Listen for button clicks from portal
  useEffect(() => {
    if (!isEmbedded) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TOOLBAR_BUTTON_CLICKED') {
        const buttonId = event.data.buttonId;
        const button = buttons.find(b => b.id === buttonId);
        if (button) {
          button.onClick();
        }
      } else if (event.data?.type === 'AUTH_TOKEN') {
        setAuthToken(event.data.token);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded, buttons]);

  return { isEmbedded, authToken, reportHeight };
};

export default usePortalIntegration;
