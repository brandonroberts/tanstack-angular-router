import { createFileRoute } from 'tanstack-angular-router-experimental';

export const Route = createFileRoute('/lazy-foo')({
  loader: async () => {
    const json = await fetch(
      'https://jsonplaceholder.typicode.com/todos/1'
    ).then((response) => response.json());
    return json as { id: number; title: string; completed: boolean };
  },
});
