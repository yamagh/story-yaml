/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renders a status badge', () => {
    render(<Badge type="status" value="WIP" />);
    expect(screen.getByText('WIP')).toBeInTheDocument();
    expect(screen.getByText('WIP')).toHaveClass('badge bg-primary-subtle text-dark');
  });

  it('renders a points badge', () => {
    render(<Badge type="points" value={5} />);
    expect(screen.getByText('5 pts')).toBeInTheDocument();
    expect(screen.getByText('5 pts')).toHaveClass('badge bg-info-subtle text-dark');
  });

  it('renders a type badge for a Story', () => {
    render(<Badge type="type" value="Story" />);
    expect(screen.getByText('Story')).toBeInTheDocument();
    expect(screen.getByText('Story')).toHaveClass('badge bg-story text-light');
  });

  it('renders a type badge for an Epic', () => {
    render(<Badge type="type" value="Epic" />);
    expect(screen.getByText('Epic')).toBeInTheDocument();
    expect(screen.getByText('Epic')).toHaveClass('badge bg-epic text-light');
  });

  it('does not render if value is not provided', () => {
    const { container } = render(<Badge type="status" value={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render if value is an empty string', () => {
    const { container } = render(<Badge type="status" value="" />);
    expect(container.firstChild).toBeNull();
  });
});