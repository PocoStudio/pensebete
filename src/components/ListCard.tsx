import type { List } from '../types';
import { useNavigate } from 'react-router-dom';


interface ListCardProps {
  list: List;
}

export default function ListCard({ list }: ListCardProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleAccess = () => {
    // Toujours rediriger vers la page d'accès, même si un token existe
    // Cela permettra à l'utilisateur de saisir un nouveau code si le token est invalide
    navigate(`/access/${list.id}`);
  };

  // Le reste du composant reste inchangé
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 w-full">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold mb-2">{list.name}</h2>
          <p className="text-gray-600 mb-2">{list.description || 'Aucune description'}</p>
          <p className="text-xs text-gray-500">
            Créée le {formatDate(list.created_at)}
          </p>
        </div>
        <button
          onClick={handleAccess}
          className="bg-amber-400 text-white py-2 px-4 rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
        >
          Accéder
        </button>
      </div>
    </div>
  );
}