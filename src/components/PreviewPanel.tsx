import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet, AlertCircle, Download, Image, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface PreviewPanelProps {
  html: string;
  css: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

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

      // Ensure gif.worker.js is in your /public directory
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
    const iframeBody = iframe.contentWindow?.document.body;

    if (!iframeBody) {
      throw new Error('No content to capture');
    }

    const images = Array.from(iframe.contentWindow?.document.images || []);
    await Promise.all(images.map(image => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }));

    return await html2canvas(iframeBody, {
      width: iframe.offsetWidth,
      height: iframe.offsetHeight,
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
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

    const carouselContainer = iframeDoc.querySelector('.carousel');
    if (!carouselContainer) {
      toast({ title: "GIF Failed", description: "A container with class '.carousel' was not found.", variant: "destructive" });
      setIsDownloading(null);
      return;
    }

    const slides = Array.from(carouselContainer.children) as HTMLElement[];
    if (slides.length < 2) {
      toast({ title: "GIF Failed", description: "At least two slides are needed to create a GIF.", variant:
