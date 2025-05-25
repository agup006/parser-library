import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store';
import About from '../About';

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('About Page', () => {
  it('renders the about page title', () => {
    renderWithProviders(<About />);
    expect(screen.getByText(/About Parser Library/i)).toBeInTheDocument();
  });

  it('displays the project description', () => {
    renderWithProviders(<About />);
    expect(screen.getByText(/This project is designed to provide a robust foundation/i)).toBeInTheDocument();
  });

  it('shows the features list', () => {
    renderWithProviders(<About />);
    expect(screen.getByText(/Type-safe development with TypeScript/i)).toBeInTheDocument();
    expect(screen.getByText(/Efficient state management with Redux Toolkit/i)).toBeInTheDocument();
    expect(screen.getByText(/Modern UI components with Tailwind CSS/i)).toBeInTheDocument();
    expect(screen.getByText(/Accessible components with Headless UI/i)).toBeInTheDocument();
    expect(screen.getByText(/Fast development with Vite/i)).toBeInTheDocument();
  });
}); 