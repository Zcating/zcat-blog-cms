import { useNavigate } from '@tanstack/react-router';

export function usePageNavigation(to: string) {
  const navigate = useNavigate();

  return (nextPage: number) => {
    navigate({ to, search: { page: String(nextPage) } });
  };
}
