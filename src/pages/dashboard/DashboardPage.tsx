import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { List, PenseBete } from '../../types';
import { fetchListById, fetchPenseBetes, createPenseBete, updatePenseBete, deletePenseBete, validateTokenForList } from '../../services/api';
import { hasAccessToList, getToken } from '../../services/authService';
import PenseBeteComponent from '../../components/PenseBete';
import PopInfo from '../../components/PopInfo';

// Fonction utilitaire pour détecter si l'écran est mobile (< 650px)
const isMobileScreen = () => window.innerWidth < 650;

const getResponsiveDimensions = () => {
  const isMobile = isMobileScreen();
  const mobileWidth = window.innerWidth;
  
  return {
    columnWidth: isMobile ? mobileWidth : 380,
    leftMargin: 0, // Pas de marge fixe pour permettre le centrage
    columnGap: isMobile ? 10 : 20,
    penseBeteWidth: isMobile ? mobileWidth : 350, 
    penseBeteHeight: isMobile ? 350 : 350 // Augmenté
  };
};

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<List | null>(null);
  const [penseBetes, setPenseBetes] = useState<PenseBete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Ajout d'un état pour le mode d'organisation
  const [organizationMode, setOrganizationMode] = useState<'column' | 'absolute'>('column');
  
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showInfoIcon, setShowInfoIcon] = useState(true);

  useEffect(() => {
    const hideInfoIcon = localStorage.getItem('hideInfoIcon');
    if (hideInfoIcon === 'true') {
      setShowInfoIcon(false);
    }
  }, []);

  // Dans la fonction useEffect
  useEffect(() => {
    if (!id) return;
    
    const listId = parseInt(id, 10);
    
    // Vérifier d'abord si l'utilisateur a un token pour cette liste
    if (!hasAccessToList(listId)) {
      navigate(`/access/${id}`);
      return;
    }
    
    // Récupérer le mode d'organisation depuis localStorage
    const savedMode = localStorage.getItem(`organizationMode_${listId}`);
    if (savedMode === 'column' || savedMode === 'absolute') {
      setOrganizationMode(savedMode);
    } else {
      // Si aucun mode n'est sauvegardé, définir 'column' comme mode par défaut
      localStorage.setItem(`organizationMode_${listId}`, 'column');
    }
    
    // Valider le token auprès du serveur
    const validateToken = async () => {
      try {
        const isValid = await validateTokenForList(listId);
        if (!isValid) {
          navigate(`/access/${id}`);
          return;
        }
        
        // Si le token est valide, charger les données
        getList();
      } catch (error) {
        console.error("Erreur lors de la validation du token:", error);
        navigate(`/access/${id}`);
      }
    };
    
    validateToken();
    
    // Fonction getList déplacée ici mais non modifiée
    async function getList() {
      try {
        const data = await fetchListById(listId);
        setList(data);
        
        // Récupérer les pense-bêtes
        try {
          const penseBetesData = await fetchPenseBetes(listId);
          
          // Appliquer l'organisation en colonnes si nécessaire
          if (savedMode === 'column') {
            const organizedPenseBetes = organizePenseBetesInColumns(penseBetesData);
            setPenseBetes(organizedPenseBetes);
          } else {
            setPenseBetes(penseBetesData);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des pense-bêtes:', err);
          // Si l'erreur est due à un problème d'authentification, rediriger vers la page d'accès
          if (err instanceof Error && (err.message === 'Accès non autorisé' || err.message === 'Token invalide')) {
            navigate(`/access/${id}`);
          }
          // Ne pas bloquer l'affichage si les pense-bêtes ne peuvent pas être chargés
        }
      } catch (err) {
        setError('Erreur lors du chargement de la liste');
        console.error(err);
        // Si l'erreur est due à un problème d'authentification, rediriger vers la page d'accès
        if (err instanceof Error && (err.message === 'Accès non autorisé' || err.message === 'Token invalide')) {
          navigate(`/access/${id}`);
        }
      } finally {
        setIsLoading(false);
      }
    };
  }, [id, navigate]);

  // Afficher les informations de l'utilisateur connecté
  const token = getToken();
  const userName = token?.user_name || 'Utilisateur';

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
  
  // Gestion des pense-bêtes
  const handleAddPenseBete = (targetElement?: string | React.MouseEvent<HTMLElement>) => {
    if (!list) return;
    
    // Si c'est un événement de clic, on ne spécifie pas de targetElement
    const target = typeof targetElement === 'string' ? targetElement : undefined;
    
    // Obtenir les dimensions adaptées à l'appareil
    const { penseBeteWidth, penseBeteHeight } = getResponsiveDimensions();
    
    let initialPosition = { 
      x: isMobileScreen() ? 5 : 50, // Position fixe à gauche au lieu de centrer
      y: target ? (target === 'list-name' ? 50 : 150) : 50 
    };
    
    // Si on est sur mobile, forcer le mode colonne
    if (isMobileScreen() && organizationMode === 'absolute') {
      setOrganizationMode('column');
      if (list) {
        localStorage.setItem(`organizationMode_${list.id}`, 'column');
      }
    }
    
    // Si on est en mode colonne, calculer directement la position finale
    if (organizationMode === 'column') {
      // Créer une copie des pense-bêtes pour calculer la position
      const tempPenseBetes = [...penseBetes];
      
      // Créer un pense-bête temporaire pour l'ajouter à la simulation
      const tempPenseBete: PenseBete = {
        id: -9999, // Utiliser un nombre négatif comme ID temporaire au lieu d'une chaîne
        list_id: list.id,
        title: 'Nouveau pense-bête',
        description: null,
        options: [],
        position: initialPosition,
        size: { width: penseBeteWidth, height: penseBeteHeight },
        color: '#FFEB3B',
        pinned: false,
        created_by: token?.user_name,
        target_element: target,
        user_name: token?.user_name,
        created_at: new Date().toISOString()
      };
      
      // Ajouter le pense-bête temporaire à la liste pour la simulation
      const simulatedList = [...tempPenseBetes, tempPenseBete];
      
      // Organiser les pense-bêtes en colonnes
      const organizedList = organizePenseBetesInColumns(simulatedList);
      
      // Récupérer la position calculée pour le nouveau pense-bête
      const calculatedPenseBete = organizedList.find(pb => pb.id === -9999); // Utiliser le même ID numérique
      if (calculatedPenseBete) {
        initialPosition = calculatedPenseBete.position;
      }
    }
    
    const newPenseBete: Omit<PenseBete, 'id' | 'created_at'> = {
      list_id: list.id,
      title: 'Nouveau pense-bête',
      description: null,
      options: [],
      position: initialPosition,
      size: { width: penseBeteWidth, height: penseBeteHeight },
      color: '#FFEB3B', // Jaune par défaut
      pinned: false,
      created_by: token?.user_name,
      target_element: target,
      user_name: token?.user_name
    };
    
    // Ajouter temporairement le pense-bête à l'interface
    const tempId = Date.now(); // ID temporaire
    setPenseBetes([...penseBetes, { ...newPenseBete, id: tempId }]);
    
    // Faire défiler vers le bas de la page sur mobile
    if (isMobileScreen()) {
      setTimeout(() => {
        // Cibler spécifiquement l'élément avec la classe 'flex-1 relative overflow-auto p-0'
        const scrollContainer = document.querySelector('.flex-1.relative.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          // Fallback au défilement de la page si l'élément n'est pas trouvé
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 1000); // Attendre 1 seconde pour laisser le temps au pense-bête d'être positionné
    }
    
    // Créer le pense-bête sur le serveur
    createPenseBete(newPenseBete).then(createdPenseBete => {
      // Remplacer le pense-bête temporaire par celui créé sur le serveur
      setPenseBetes(prev => {
        // Créer une nouvelle liste avec le pense-bête créé à la place du temporaire
        const updatedList = prev.map(pb => pb.id === tempId ? createdPenseBete : pb);
        
        // Réorganiser les pense-bêtes si en mode colonne
        return organizationMode === 'column' ? organizePenseBetesInColumns(updatedList) : updatedList;
      });
    }).catch(err => {
      console.error('Erreur lors de la création du pense-bête:', err);
      // Supprimer le pense-bête temporaire en cas d'erreur
      setPenseBetes(prev => prev.filter(pb => pb.id !== tempId));
    });
  };
  
  const handleUpdatePenseBete = (updatedPenseBetee: PenseBete) => {
    // Mettre à jour localement
    setPenseBetes(prev => 
      prev.map(pb => pb.id === updatedPenseBetee.id ? updatedPenseBetee : pb)
    );
    // Mettre à jour sur le serveur
    updatePenseBete(updatedPenseBetee).catch(err => {
      console.error('Erreur lors de la mise à jour de la position du pense-bête:', err);
    });
  };
  
  const handlePinPenseBete = (pinnedPenseBete: PenseBete): Promise<void> => {
    // Mettre à jour localement
    setPenseBetes(prev => 
      prev.map(pb => pb.id === pinnedPenseBete.id ? pinnedPenseBete : pb)
    );
    
    // Mettre à jour sur le serveur et retourner la promesse
    return updatePenseBete(pinnedPenseBete)
      .then(_updatedPenseBete => {
        // Mise à jour réussie
        console.log('Pense-bête épinglé avec succès');
      })
      .catch(err => {
        console.error('Erreur lors de l\'épinglage du pense-bête:', err);
        throw err; // Propager l'erreur
      });
  };

  const handleDeletePenseBete = (id: number) => {
    // Supprimer localement
    setPenseBetes(prev => {
      const filtered = prev.filter(pb => pb.id !== id);
      // Réorganiser si en mode colonne
      return organizationMode === 'column' ? organizePenseBetesInColumns(filtered) : filtered;
    });
    
    // Supprimer sur le serveur
    if (list) {
      deletePenseBete(list.id, id).catch(err => {
        console.error('Erreur lors de la suppression du pense-bête:', err);
        // Recharger les pense-bêtes en cas d'erreur
        if (list) {
          fetchPenseBetes(list.id).then(data => {
            setPenseBetes(organizationMode === 'column' ? organizePenseBetesInColumns(data) : data);
          });
        }
      });
    }
  };
  
  const handleReorganizePenseBetes = () => {
    // Basculer entre les modes d'organisation
    const newMode = organizationMode === 'absolute' ? 'column' : 'absolute';
    setOrganizationMode(newMode);
    
    // Sauvegarder le mode dans localStorage
    if (list) {
      localStorage.setItem(`organizationMode_${list.id}`, newMode);
    }
    
    // Réorganiser les pense-bêtes si nécessaire
    if (newMode === 'column') {
      // Créer une copie des pense-bêtes pour les manipuler
      const updatedPenseBetes = organizePenseBetesInColumns([...penseBetes]);
      // Mettre à jour l'état local immédiatement
      setPenseBetes(updatedPenseBetes);
    } else {
      // Si on passe en mode absolu, on peut simplement recharger les pense-bêtes du serveur
      // pour récupérer leurs positions originales
      if (list) {
        fetchPenseBetes(list.id).then(data => {
          setPenseBetes(data);
        }).catch(err => {
          console.error('Erreur lors du chargement des pense-bêtes:', err);
        });
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full max-w-md" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error || 'Liste non trouvée'}</span>
        </div>
        <button
          onClick={handleBack}
          className="mt-4 bg-amber-400 text-white py-2 px-4 rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
        >
          Retour aux listes
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      {/* Header fixe - hauteur réduite */}
      <div className="relative flex-shrink-0 flex flex-col md:flex-row justify-between items-center min-h-13 px-4 py-2 bg-white border-b border-gray-200">
        <button
          onClick={handleBack}
          className="text-amber-500 hover:text-amber-600 font-medium flex items-center mb-2 md:mb-0"
        >
          &larr; Retour
        </button>
      
        <div className={`${isMobileScreen() ? 'w-full' : 'absolute left-1/2 -translate-x-1/2'} flex items-center justify-center mb-2 md:mb-0`}>
          <svg className="w-5 h-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd"></path>
          </svg>
          <h1 
            className="text-lg font-bold text-gray-800 cursor-pointer hover:text-amber-500 truncate" 
            onClick={() => handleAddPenseBete('list-name')}
            title="Ajouter un pense-bête pour le nom de la liste"
          >
            {list?.name}
          </h1>
        </div>
      
        <div className="flex items-center">
          <svg className="w-4 h-4 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
          </svg>
          <span className="text-sm text-gray-700">Connecté: <span className="text-amber-600 font-medium">{userName}</span></span>
        </div>
      </div>

      {/* Boutons flottants fixes en bas à droite */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-row space-x-4">
        <button
          onClick={handleAddPenseBete}
          className="bg-amber-400 text-white p-3 rounded-full shadow-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
          title="Ajouter un pense-bête"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Cacher le bouton de mode absolu sur mobile */}
        {!isMobileScreen() && (
          <button
            onClick={handleReorganizePenseBetes}
            className="bg-amber-400 text-white p-3 rounded-full shadow-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
            title={`Mode actuel: ${organizationMode === 'absolute' ? 'Absolu' : 'Colonnes'}`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Bouton d'information en bas à gauche */}
      {showInfoIcon && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => setShowInfoPopup(true)}
            className="bg-amber-400 text-white p-3 rounded-full shadow-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 animate-pulse-slow"
            title="Informations"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Popup d'information */}
      {showInfoPopup && (
        <PopInfo 
          onClose={() => setShowInfoPopup(false)} 
          onHideInfoIcon={() => setShowInfoIcon(false)}
        />
      )}
      
      {/* Contenu principal qui prend toute la hauteur restante */}
      <div className={`flex-1 ${isMobileScreen() ? 'p-1' : 'p-4'} overflow-hidden relative`}>
        <div className="h-full bg-white flex flex-col" 
          style={{
            backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '-1px -1px',
            zIndex: 0 // S'assurer que le quadrillage est en arrière-plan
          }}
        >
          <div className={`flex-1 relative overflow-auto ${isMobileScreen() ? 'p-0' : 'p-4'}`} style={{ minHeight: '500px', zIndex: 1 }}>
            <div className="absolute top-0 left-0 w-full z-0 select-none pointer-events-none">
              <p className="text-gray-600 mb-4">{list?.description || 'Aucune description'}</p>
              <p 
                className="text-sm text-gray-500 mb-6"
                title="Ajouter un pense-bête pour la date de création"
              >
                Créée le {list && formatDate(list.created_at)}
              </p>
            </div>
            
            {penseBetes.length === 0 ? (
              <div className="flex items-center justify-center min-h-[80vh]">
                <div className="items-center justify-center rounded-md text-center w-full max-w-2xl">
                  <p className="text-gray-600 text-xl mb-4">
                    Cette liste est actuellement vide.
                  </p>
                  <div className="text-5xl mb-4">📝</div>
                  <button
                    onClick={handleAddPenseBete}
                    className="mt-4 bg-amber-400 text-white py-2 px-4 rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 flex items-center mx-auto"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Ajouter un pense-bête
                  </button>
                </div>
              </div>
            ) : (
              <>
                {penseBetes.map(penseBete => (
                  // Dans le rendu
                  <PenseBeteComponent
                    key={penseBete.id}
                    penseBete={penseBete}
                    onUpdate={handleUpdatePenseBete}
                    onPin={handlePinPenseBete}
                    onDelete={handleDeletePenseBete}
                    organizationMode={organizationMode}
                  />
                ))}
                
                {/* Suppression des boutons flottants ici car ils sont maintenant en haut */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function organizePenseBetesInColumns(penseBetesData: PenseBete[]): PenseBete[] {
  // Obtenir les dimensions adaptées à l'appareil
  const { columnWidth, columnGap} = getResponsiveDimensions();
  const startY = 0; // Position Y de départ à 0
  const isMobile = isMobileScreen();
  
  // Trier les pense-bêtes par ordre de création (du plus ancien au plus récent)
  const sortedPenseBetes = [...penseBetesData].sort((a, b) => {
    // Gérer le cas où created_at est undefined
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });
  
  // Sur mobile, toujours utiliser une seule colonne
  let currentColumn = 0;
  const columnHeights: number[] = [startY]; // Hauteur actuelle de chaque colonne
  
  // Créer un tableau pour stocker les pense-bêtes mis à jour
  const updatedPenseBetes: PenseBete[] = [];
  
  // Première passe pour déterminer le nombre de colonnes (pour le centrage)
  if (!isMobile) {
    sortedPenseBetes.forEach(penseBete => {
      // Mettre à jour la hauteur de la colonne actuelle
      if (!columnHeights[currentColumn]) {
        columnHeights[currentColumn] = startY;
      }
      
      columnHeights[currentColumn] += (penseBete.size?.height || 400) + 10;
      
      // Passer à la colonne suivante si la hauteur dépasse un certain seuil
      if (columnHeights[currentColumn] > window.innerHeight - 200) {
        currentColumn++;
        // Initialiser la hauteur de la nouvelle colonne si nécessaire
        if (!columnHeights[currentColumn]) {
          columnHeights[currentColumn] = startY;
        }
      }
    });
  }
  
  
  // Réinitialiser pour la deuxième passe
  currentColumn = 0;
  for (let i = 0; i < columnHeights.length; i++) {
    columnHeights[i] = startY;
  }
  
  // Parcourir tous les pense-bêtes et les positionner en colonnes
  sortedPenseBetes.forEach(penseBete => {
    // Calculer la position X en fonction de la colonne actuelle
    // Sur mobile, positionner le pense-bête avec une petite marge à gauche
    const posX = isMobile 
      ? 5 
      : currentColumn * (columnWidth + columnGap);
    
    // Créer une copie du pense-bête avec la nouvelle position
    const updatedPenseBete = {
      ...penseBete,
      position: { x: posX, y: columnHeights[currentColumn] }
    };
    
    // Ajouter le pense-bête mis à jour au tableau
    updatedPenseBetes.push(updatedPenseBete);
    
    // Mettre à jour la hauteur de la colonne actuelle
    columnHeights[currentColumn] += (penseBete.size?.height || 400) + 10;
    
    // Sur mobile, on reste toujours dans la même colonne
    // Sur desktop, on passe à la colonne suivante si la hauteur dépasse un certain seuil
    if (!isMobile && columnHeights[currentColumn] > window.innerHeight - 200) {
      currentColumn++;
      // Initialiser la hauteur de la nouvelle colonne si nécessaire
      if (!columnHeights[currentColumn]) {
        columnHeights[currentColumn] = startY;
      }
    }
  });
  
  return updatedPenseBetes;
}
