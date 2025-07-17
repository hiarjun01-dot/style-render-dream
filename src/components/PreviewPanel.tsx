import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  html: string;
  css: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel({ html, css }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [error, setError] = useState<string | null>(null);

  const deviceDimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  };

  useEffect(() => {
    if (!iframeRef.current) return;

    try {
      setError(null);

      let processedHtml = html;
      // If the provided HTML is a fragment, wrap it for preview.
      if (!/<\/body>/i.test(processedHtml)) {
        processedHtml = `<body>${processedHtml}</body>`;
      }
      if (!/<\/head>/i.test(processedHtml)) {
         processedHtml = `<head><meta charset="UTF-8"><title>Preview</title></head>${processedHtml}`;
      }

      // Correctly inject the CSS from the editor right before the closing </head> tag.
      // This is case-insensitive and works reliably.
      const fullHtml = processedHtml.replace(
        /<\/head>/i,
        `<style>${css}</style></head>`
      );

      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown preview error occurred';
      setError(errorMessage);
      console.error('Preview error:', err);
    }
  }, [html, css, device]);

  const getDeviceIcon = (deviceType: DeviceType) => {
    switch (deviceType) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Live Preview</h2>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['desktop', 'tablet', 'mobile'] as DeviceType[]).map((deviceType) => (
            <Button
              key={deviceType}
              variant={device === deviceType ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDevice(deviceType)}
              className={device === deviceType ? 'glow-button' : ''}
            >
              {getDeviceIcon(deviceType)}
              <span className="ml-2 capitalize">{deviceType}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Container */}
      <Card className="card-gradient flex-1 p-4 flex items-center justify-center">
        {error ? (
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Preview Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-full h-full transition-all duration-300 ease-in-out"
            style={{
              maxWidth: deviceDimensions[device].width,
              maxHeight: deviceDimensions[device].height
            }}
          >
            <iframe
              ref={iframeRef}
              className="preview-iframe w-full h-full border-0 rounded-lg bg-white shadow-lg"
              sandbox="allow-scripts allow-same-origin"
              title="HTML/CSS Preview"
            />
          </div>
        )}
      </Card>

      {/* Device Info */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Viewing in {device} mode ({deviceDimensions[device].width} × {deviceDimensions[device].height})
      </div>
    </div>
  );
}
