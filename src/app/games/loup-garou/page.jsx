import { getUser } from '@/lib/auth';
import LoupGarouGame from './LoupGarouGame';

export const metadata = {
  title: "Loup-Garou - Touches D'Art",
  description: "Jouez au Loup-Garou en ligne ou en présentiel avec l'association Touches D'Art.",
};

export default async function Page() {
  const user = await getUser();
  // Ensure user is truly authenticated (guard against { error: ... } objects)
  const safeUser = (user && !user.error) ? user : null;

  return (
    <LoupGarouGame user={safeUser} />
  );
}
