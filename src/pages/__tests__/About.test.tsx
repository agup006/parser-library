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
    expect(screen.getByText(/A comprehensive tool for testing and validating Fluent Bit regex parsers/i)).toBeInTheDocument();
  });

  it('shows the features list', () => {
    renderWithProviders(<About />);
    expect(screen.getByText(/Onigmo Regex Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Real-time Validation/i)).toBeInTheDocument();
    expect(screen.getByText(/Time Format Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Testing/i)).toBeInTheDocument();
  });

  it('displays the mission statement', () => {
    renderWithProviders(<About />);
    expect(screen.getByText(/Our Mission/i)).toBeInTheDocument();
    expect(screen.getByText(/We believe that log parsing shouldn't be a guessing game/i)).toBeInTheDocument();
  });

  it('shows technical foundation section', () => {
    renderWithProviders(<About />);
    expect(screen.getByText(/Technical Foundation/i)).toBeInTheDocument();
    expect(screen.getByText(/React 18 with TypeScript for type-safe development/i)).toBeInTheDocument();
    expect(screen.getByText(/Redux Toolkit for efficient state management/i)).toBeInTheDocument();
  });
}); 