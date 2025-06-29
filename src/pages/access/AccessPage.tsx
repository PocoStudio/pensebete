import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateTokenForList, verifyAccessCodeWithUser } from '../../services/api';
import { saveToken, hasAccessToList, removeToken } from '../../services/authService';

export default function AccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dans le useEffect
  useEffect(() => {
    if (!id) return;
    
    const listId = parseInt(id, 10);
    
    // Vérifier si l'utilisateur a un token et s'il est valide
    const checkToken = async () => {
      if (hasAccessToList(listId)) {
        try {
          // Vérifier si le token est valide auprès du serveur
          const isValid = await validateTokenForList(listId);
          if (isValid) {
            // Si le token est valide, rediriger vers le dashboard
            navigate(`/dashboard/${id}`);
          }
          // Si le token n'est pas valide, rester sur la page d'accès
        } catch (error) {
          // En cas d'erreur, rester sur la page d'accès
          console.error("Erreur lors de la validation du token:", error);
        }
      }
    };
    
    checkToken();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const authToken = await verifyAccessCodeWithUser({
        id: parseInt(id!, 10),
        access_code: accessCode,
        user_name: userName
      });
      
      // Sauvegarder le token dans le localStorage
      saveToken(authToken);
      
      // Rediriger vers le dashboard
      navigate(`/dashboard/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      // Si le code d'accès est incorrect, supprimer le token et rediriger vers la liste des listes
      if (err instanceof Error && (err.message === 'Code d\'accès incorrect' || err.message.includes('Erreur lors de la vérification'))) {
        // Supprimer le token existant
        removeToken();
        
        setTimeout(() => {
          navigate('/');
        }, 2000); // Attendre 2 secondes pour que l'utilisateur puisse voir le message d'erreur
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Le reste du composant reste inchangé
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <button
        onClick={handleBack}
        className="mb-6 text-amber-500 hover:text-amber-600 font-medium flex items-center"
      >
        &larr; Retour aux listes
      </button>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Accéder à la liste</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
              Votre nom
            </label>
            <input
              type="text"
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="access-code" className="block text-sm font-medium text-gray-700 mb-1">
              Code d'accès
            </label>
            <input
              type="text"
              id="access-code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-400 text-white py-2 px-4 rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Vérification...' : 'Accéder à la liste'}
          </button>
        </form>
      </div>
    </div>
  );
}