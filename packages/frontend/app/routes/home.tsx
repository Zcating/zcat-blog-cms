import { redirect } from 'react-router';

export async function clientLoader() {
  return redirect('/login');
}

export default function Home() {
  return null;
}
