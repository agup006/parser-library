import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../Home';

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(<Home />);
    expect(screen.getByText(/Welcome to Parser Library/i)).toBeInTheDocument();
  });

  it('displays the list of features', () => {
    render(<Home />);
    expect(screen.getByText(/React with TypeScript/i)).toBeInTheDocument();
    expect(screen.getByText(/Redux Toolkit for state management/i)).toBeInTheDocument();
    expect(screen.getByText(/React Router for navigation/i)).toBeInTheDocument();
    expect(screen.getByText(/Tailwind CSS for styling/i)).toBeInTheDocument();
    expect(screen.getByText(/Headless UI for accessible components/i)).toBeInTheDocument();
  });
}); 