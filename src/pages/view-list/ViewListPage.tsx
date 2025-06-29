import { useState, useEffect } from 'react';
import type { List } from '../../types';
import { fetchLists } from '../../services/api';
import ListCard from '../../components/ListCard';

export default function ViewListPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getLists = async () => {
      try {
        const data = await fetchLists();
        setLists(data);
      } catch (err) {
        setError('Erreur lors du chargement des listes');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getLists();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      
      {lists.length === 0 ? (
        <p className="text-center text-gray-600">Aucune liste disponible pour le moment.</p>
      ) : (
        <div className="flex flex-col space-y-4 max-w-2xl mx-auto">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}