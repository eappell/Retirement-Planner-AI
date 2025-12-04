import { useEffect, useState } from 'react';

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

  return { isEmbedded, authToken };
};

export default usePortalIntegration;
