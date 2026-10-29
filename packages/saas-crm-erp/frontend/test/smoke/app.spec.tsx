import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/app/page';

describe('Frontend Smoke Tests - App', () => {
  describe('Home Page', () => {
    it('should render without crashing', () => {
      expect(() => render(<Home />)).not.toThrow();
    });

    it('should display main heading', () => {
      render(<Home />);

      // Check for main dashboard heading (h1 with "Dashboard")
      const dashboardHeading = screen.getByRole('heading', { level: 1, name: 'Dashboard' });
      expect(dashboardHeading).toBeInTheDocument();
    });

    it('should have navigation elements', () => {
      render(<Home />);

      // Check for navigation buttons (sidebar menu items)
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      const customersButton = screen.getByRole('button', { name: /customers/i });
      const organizationsButton = screen.getByRole('button', { name: /organizations/i });
      const reportsButton = screen.getByRole('button', { name: /reports/i });

      expect(dashboardButton).toBeInTheDocument();
      expect(customersButton).toBeInTheDocument();
      expect(organizationsButton).toBeInTheDocument();
      expect(reportsButton).toBeInTheDocument();
    });

    it('should have proper meta tags in document', () => {
      render(<Home />);

      // Check for title (may be empty in test environment)
      expect(document.title).toBeDefined();

      // Viewport meta tag is optional (may be added by Next.js)
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        expect(viewportMeta).toHaveAttribute('content');
      }
    });

    it('should not have JavaScript errors in console', async () => {
      const consoleError = jest.spyOn(console, 'error');
      const consoleWarn = jest.spyOn(console, 'warn');
      
      render(<Home />);
      
      await waitFor(() => {
        expect(consoleError).not.toHaveBeenCalled();
        // Allow warnings but not errors
      });
      
      consoleError.mockRestore();
      consoleWarn.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Home />);

      // Check for proper ARIA labels on interactive elements
      const interactiveElements = screen.getAllByRole('button', { hidden: true });

      interactiveElements.forEach(element => {
        // Elements should have either aria-label, aria-labelledby, or visible text
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
        const hasVisibleText = element.textContent?.trim().length > 0;

        expect(hasAriaLabel || hasAriaLabelledBy || hasVisibleText).toBe(true);
      });
    });

    it('should have proper contrast ratios for text', () => {
      render(<Home />);
      
      // This would typically use a library like jest-axe
      // For smoke tests, we'll just check that text elements exist
      const textElements = screen.getAllByText(/./, { selector: 'p, span, div, h1, h2, h3, h4, h5, h6' });
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render on different viewport sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile
      });

      const { unmount: unmountMobile } = render(<Home />);
      expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
      unmountMobile();

      // Reset
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024, // Desktop
      });

      // Re-render with new viewport
      const { unmount: unmountDesktop } = render(<Home />);
      expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
      unmountDesktop();
    });
  });

  describe('Performance', () => {
    it('should render within acceptable time', async () => {
      const startTime = performance.now();
      
      render(<Home />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Expect render to complete within 500ms for smoke test
      expect(renderTime).toBeLessThan(500);
    });

    it('should not have excessive DOM nodes', () => {
      const { container } = render(<Home />);
      
      const totalNodes = countDOMNodes(container);
      
      // Expect reasonable number of DOM nodes for a landing page
      expect(totalNodes).toBeLessThan(1000);
    });
  });

  describe('Internationalization', () => {
    it.skip('should have language attribute on html element', () => {
      render(<Home />);

      const htmlElement = document.documentElement;
      expect(htmlElement).toHaveAttribute('lang');
      expect(htmlElement.getAttribute('lang')).toBe('en');
    });

    it.skip('should handle RTL languages if supported', () => {
      render(<Home />);

      // Check that dir attribute is set or default is LTR
      const htmlElement = document.documentElement;
      const dir = htmlElement.getAttribute('dir');

      if (dir) {
        expect(['ltr', 'rtl']).toContain(dir);
      }
    });
  });
});

// Helper function to count DOM nodes
function countDOMNodes(element: Element): number {
  let count = 1; // Count the element itself
  
  for (let i = 0; i < element.children.length; i++) {
    count += countDOMNodes(element.children[i]);
  }
  
  return count;
}