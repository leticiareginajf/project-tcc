import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the accessible service options', () => {
  render(<App />);
  expect(screen.getByText('Atendimento ao Surdo')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Iniciar o atendimento' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Iniciar o chat' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Agendar atendimento' })).toBeInTheDocument();
});
