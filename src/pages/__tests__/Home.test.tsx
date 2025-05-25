import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store';
import Home from '../Home';

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Home Page', () => {
  it('renders the welcome message', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Fluent Bit Parser Library/i)).toBeInTheDocument();
  });

  it('displays the list of features', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Parser Tester/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Real-time Validation/i)).toHaveLength(2); // Appears in both description and heading
    expect(screen.getByText(/Time Parsing/i)).toBeInTheDocument();
  });

  it('shows the technical details section', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Built for Fluent Bit Engineers/i)).toBeInTheDocument();
    expect(screen.getByText(/Onigmo Regex Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Parser Development/i)).toBeInTheDocument();
  });

  it('displays the framework technologies', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Built with Modern Technologies/i)).toBeInTheDocument();
    expect(screen.getByText(/React \+ TypeScript/i)).toBeInTheDocument();
    expect(screen.getByText(/Redux Toolkit/i)).toBeInTheDocument();
  });
}); 