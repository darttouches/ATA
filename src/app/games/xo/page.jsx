import { getUser } from '@/lib/auth';
import XOGame from './XOGame';

export const metadata = {
  title: "XO 4x4 - Touches D'Art",
  description: "Défiez vos amis sur une grille 4x4 stratégique. Alignez 4, éjectez l'adversaire !",
};

export default async function Page() {
  const user = await getUser();
  const safeUser = (user && !user.error) ? user : null;

  return (
    <XOGame user={safeUser} />
  );
}
