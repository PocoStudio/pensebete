import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { List } from '../../types';
import { fetchListById } from '../../services/api';

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getList = async () => {
      if (!id) return;
      
      try {
        const data = await fetchListById(parseInt(id, 10));
        setList(data);
      } catch (err) {
        setError('Erreur lors du chargement de la liste');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getList();
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error || 'Liste non trouvée'}</span>
        </div>
        <button
          onClick={handleBack}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Retour aux listes
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="mb-6 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        &larr; Retour aux listes
      </button>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{list.name}</h1>
        <p className="text-gray-600 mb-6">{list.description || 'Aucune description'}</p>
        <p className="text-sm text-gray-500">
          Créée le {formatDate(list.created_at)}
        </p>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <p className="text-center text-gray-600">
            Cette liste est actuellement vide. Le contenu sera implémenté dans une future mise à jour.
          </p>
        </div>
      </div>
    </div>
  );
}