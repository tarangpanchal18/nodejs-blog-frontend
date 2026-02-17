import { useEffect } from 'react';

export const Footer = () => {
  useEffect(() => {
    // Load the Poptin pixel script
    const script = document.createElement('script');
    script.id = 'pixel-script-poptin';
    script.src = 'https://cdn.popt.in/pixel.js?id=e93ec80650c49';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.getElementById('pixel-script-poptin');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <footer className="border-t border-border bg-muted/50 py-6 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Meowwdium. All rights reserved.</p>
    </footer>
  );
};
