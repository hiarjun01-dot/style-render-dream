import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet, AlertCircle, Download, Image, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
// NEW: Import the GIF library
import GIF from 'gif.js';

interface PreviewPanelProps {
  html: string;
  css: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

// NEW: Helper function to introduce delays between captures
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function PreviewPanel({ html, css }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const { toast } = useToast();

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
      if (!/<\/body>/i.test(processedHtml)) {
        processedHtml = `<body>${processedHtml}</body>`;
      }
      if (!/<\/head>/i.test(processedHtml)) {
          processedHtml = `<head><meta charset="UTF-8"><title>Preview</title></head>${processedHtml}`;
      }

      // This script path is crucial for gif.js to work.
      // Ensure 'gif.worker.js' from the 'gif.js' package is in your public/static assets folder.
      const fullHtml = processedHtml.replace(
        /<\/head>/i,
        `<style>${css}</style><script src="/gif.worker.js"></script></head>`
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

  const captureIframeContent = async (): Promise<HTMLCanvasElement> => {
    if (!iframeRef.current) throw new Error('Preview not available');
    
    const iframe = iframeRef.current;
    
    // Use the iframe's contentWindow's body for html2canvas
    const iframeBody = iframe.contentWindow?.document.body;

    if (!iframeBody) {
      throw new Error('No content to capture');
    }

    // Ensure all images inside the iframe are loaded before capturing
    const images = Array.from(iframe.contentWindow?.document.images || []);
    const promises = images.map(image => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
            image.onload = () => resolve();
            image.onerror = () => resolve(); // Resolve even on error to not block the process
        });
    });
    await Promise.all(promises);
    
    // We can directly capture the iframe's body if cross-origin policies are aligned.
    // The sandbox="allow-same-origin" helps here.
    return await html2canvas(iframeBody, {
      width: iframe.offsetWidth,
      height: iframe.offsetHeight,
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality capture
      useCORS: true, // Allow loading of cross-origin images
      logging: false,
    });
  };

  const downloadImage = async (format: 'png' | 'jpg') => {
    setIsDownloading(format);
    try {
      const canvas = await captureIframeContent();
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpg' ? 0.92 : undefined;
      
      canvas.toBlob((blob) => {
        if (!blob) {
            throw new Error('Failed to generate image blob.');
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capture.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Starting!",
          description: `Your preview has been saved as a ${format.toUpperCase()} file.`,
        });
      }, mimeType, quality);

    } catch (err) {
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : 'Could not download the image.',
        variant: "destructive"
      });
    } finally {
      setIsDownloading(null);
    }
  };

  // --- MODIFIED SECTION: Animated GIF Download ---
  const downloadGIF = async () => {
    if (!iframeRef.current) {
        toast({ title: "Error", description: "Preview not available.", variant: "destructive" });
        return;
    }
    setIsDownloading('gif');
    
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument;

    if (!iframeDoc) {
        toast({ title: "Error", description: "Could not access preview content.", variant: "destructive" });
        setIsDownloading(null);
        return;
    }

    // This logic assumes your carousel has a container with class 'carousel'
    // and its direct children are the slides.
    const carouselContainer = iframeDoc.querySelector('.carousel');
    if (!carouselContainer) {
        toast({ title: "GIF Failed", description: "A container with class '.carousel' was not found.", variant: "destructive" });
        setIsDownloading(null);
        return;
    }
    
    const slides = Array.from(carouselContainer.children) as HTMLElement[];
    if (slides.length < 2) {
        toast({ title: "GIF Failed", description: "At least two slides are needed to create a GIF.", variant: "destructive" });
        setIsDownloading(null);
        return;
    }

    try {
        toast({
            title: "Generating GIF...",
            description: `Capturing ${slides.length} slides. Please wait.`,
        });

        // Initialize gif.js library
        const gif = new GIF({
            workers: 2,
            quality: 10, // Lower is better
            width: iframe.offsetWidth,
            height: iframe.offsetHeight,
        });
        
        const originalSlideStyles = slides.map(slide => slide.style.display);
        
        // Loop through slides, capture each one, and add it as a frame
        for (let i = 0; i < slides.length; i++) {
            // Show only the current slide
            slides.forEach(s => s.style.display = 'none');
            slides[i].style.display = 'block';

            await sleep(100); // Wait for render

            const canvas = await captureIframeContent();
            gif.addFrame(canvas, { delay: 1500 }); // 1.5 seconds per slide
        }

        // Restore original slide visibility
        slides.forEach((slide, index) => {
            slide.style.display = originalSlideStyles[index] || '';
        });

        // Finalize the GIF and trigger download
        gif.on('finished', (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'carousel-animation.gif';
            a.click();
            URL.revokeObjectURL(url);
            
            setIsDownloading(null);
            toast({
                title: "Download Complete!",
                description: "Your animated GIF has been saved.",
            });
        });

        gif.render();

    } catch (err) {
        toast({
            title: "GIF Generation Failed",
            description: err instanceof Error ? err.message : 'An unknown error occurred.',
            variant: "destructive"
        });
        setIsDownloading(null);
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

      {/* Download Options */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => downloadImage('png')} disabled={!!isDownloading || !!error} className="flex items-center gap-2">
          {isDownloading === 'png' ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Image className="w-4 h-4" />}
          Download PNG
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadImage('jpg')} disabled={!!isDownloading || !!error} className="flex items-center gap-2">
          {isDownloading === 'jpg' ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <FileImage className="w-4 h-4" />}
          Download JPG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadGIF} disabled={!!isDownloading || !!error} className="flex items-center gap-2">
          {isDownloading === 'gif' ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Download className="w-4 h-4" />}
          Download GIF
        </Button>
      </div>

      {/* Device Info */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Viewing in {device} mode
      </div>
    </div>
  );
}
