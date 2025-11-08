import * as React from "react";

const MOBILE_BREAKPOINT = 640; // sm
const TABLET_BREAKPOINT = 1024; // lg

export function useDevice() {
  const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setDevice('mobile');
      } else if (width < TABLET_BREAKPOINT) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    // Initial check
    updateDevice();

    // Add event listener
    window.addEventListener('resize', updateDevice);

    // Cleanup
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  return {
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    device
  };
}
