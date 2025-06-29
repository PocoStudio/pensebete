import { useState, useRef, useEffect } from 'react';
import type { PenseBete as PenseBeteType, PenseBeteOption } from '../types';

interface PenseBeteProps {
  penseBete: PenseBeteType;
  onUpdate: (penseBete: PenseBeteType) => void;
  onPin: (penseBete: PenseBeteType) => Promise<void>;
  onDelete?: (id: number) => void;
  organizationMode: 'column' | 'absolute';
}

export default function PenseBete({ penseBete, onUpdate, onPin, onDelete, organizationMode }: PenseBeteProps) {
  const [isEditing, setIsEditing] = useState(!penseBete.pinned);
  const [title, setTitle] = useState(penseBete.title);
  const [description, setDescription] = useState(penseBete.description || '');
  const [options, setOptions] = useState<PenseBeteOption[]>(penseBete.options);
  const [position, setPosition] = useState(penseBete.position);
  const [size, setSize] = useState(penseBete.size);
  const [color, setColor] = useState(penseBete.color);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newOption, setNewOption] = useState('');
  
  // Ajouter cet effet pour synchroniser la position locale avec la prop
  useEffect(() => {
    // Ne pas mettre à jour pendant le glisser-déposer pour éviter les conflits
    // et ne pas mettre à jour si la position est déjà définie (pour éviter le déplacement après création)
    if (!isDragging && !isResizing && JSON.stringify(position) !== JSON.stringify(penseBete.position)) {
      setPosition(penseBete.position);
    }
  }, [penseBete.position, isDragging, isResizing]);
  
  const penseBeteRef = useRef<HTMLDivElement>(null);
  
  const MIN_WIDTH = window.innerWidth < 650 ? 200 : 250;
  const MAX_WIDTH = window.innerWidth < 650 ? 290 : 380;
  // Augmenter ces valeurs
  const MIN_HEIGHT = window.innerWidth < 650 ? 250 : 300; 
  const MAX_HEIGHT = window.innerWidth < 650 ? 500 : 500; 
  
  // Couleurs disponibles
  const availableColors = [
    '#FFEB3B', // Jaune
    '#FFC107', // Ambre
    '#FF9800', // Orange
    '#FF5722', // Orange foncé
    '#E91E63', // Rose
    '#9C27B0', // Violet
    '#673AB7', // Violet foncé
    '#3F51B5', // Indigo
    '#2196F3', // Bleu
    '#03A9F4', // Bleu clair
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Vert
    '#8BC34A', // Vert clair
    '#CDDC39', // Lime
  ];
  
  // Gestion du déplacement
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ne pas permettre le déplacement si en mode colonnes ou si épinglé sans édition
    if ((organizationMode === 'column') || (penseBete.pinned && !isEditing)) return;
    
    // Vérifier si on clique sur un élément interactif (input, button, etc.)
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || 
        target.tagName === 'TEXTAREA' || target.tagName === 'LABEL' ||
        target.tagName === 'SVG' || target.closest('button')) {
      return; // Ne pas démarrer le déplacement si on clique sur un contrôle
    }
    
    setIsDragging(true);
    const rect = penseBeteRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && penseBeteRef.current) {
      const parentRect = penseBeteRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        // Permettre le positionnement partout, y compris dans la zone de texte
        const newX = Math.max(0, Math.min(e.clientX - parentRect.left - dragOffset.x, parentRect.width - size.width));
        const newY = Math.max(0, Math.min(e.clientY - parentRect.top - dragOffset.y, parentRect.height - size.height));
        
        setPosition({ x: newX, y: newY });
      }
    } else if (isResizing && penseBeteRef.current) {
      const parentRect = penseBeteRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const newWidth = Math.max(MIN_WIDTH, Math.min(e.clientX - position.x - parentRect.left, MAX_WIDTH));
        const newHeight = Math.max(MIN_HEIGHT, Math.min(e.clientY - position.y - parentRect.top, MAX_HEIGHT));
        
        setSize({ width: newWidth, height: newHeight });
      }
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      
      // Mettre à jour le pense-bête avec la nouvelle position/taille
      onUpdate({
        ...penseBete,
        position,
        size
      });
    }
  };
  
  // Ajouter/supprimer les écouteurs d'événements
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position, size]);
  
  // Gestion du redimensionnement
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isEditing && penseBete.pinned) return;
    e.stopPropagation();
    setIsResizing(true);
  };
  
  // Gestion des options
  const handleOptionChange = (index: number, checked: boolean) => {
    // Créer une copie des options pour ne pas modifier directement l'état
    const newOptions = [...options];
    const currentUser = penseBete.user_name || 'Utilisateur';
    
    // S'assurer que checkedUsers est un tableau valide
    if (!newOptions[index].checkedUsers || !Array.isArray(newOptions[index].checkedUsers)) {
      newOptions[index].checkedUsers = [];
    }
    
    if (checked) {
      // Ajouter l'utilisateur actuel à la liste s'il n'y est pas déjà
      if (!newOptions[index].checkedUsers.includes(currentUser)) {
        newOptions[index].checkedUsers.push(currentUser);
      }
    } else {
      // Retirer l'utilisateur actuel de la liste
      newOptions[index].checkedUsers = newOptions[index].checkedUsers.filter(user => user !== currentUser);
    }
    
    // Mettre à jour l'état local
    setOptions(newOptions);
    
    // Envoyer les mises à jour au serveur
    onUpdate({
      ...penseBete,
      options: newOptions
    });
  };
  
  const handleAddOption = () => {
    if (newOption.trim() === '') return;
    
    const newOptions = [...options, { text: newOption.trim(), checkedUsers: [] }];
    setOptions(newOptions);
    setNewOption('');
  };
  
  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };
  
  // Enregistrer les modifications
  // const handleSave = () => {
  //   const updatedPenseBete = {
  //     ...penseBete,
  //     title,
  //     description: description || null,
  //     options,
  //     position,
  //     size,
  //     color
  //   };
    
  //   console.log('Saving updates:', updatedPenseBete);
  //   onUpdate(updatedPenseBete);
  //   setIsEditing(false); // Fermer le mode édition après sauvegarde
  // };
  
  // Épingler le pense-bête
  const handlePin = () => {
    // S'assurer que les options conservent leurs attributs checked_by, checked_at et checked_users
    // Dans la fonction handlePin (ligne ~205)
    const pinnedPenseBete = {
      ...penseBete,
      title,
      description: description || null,
      options: options.map(opt => ({
        ...opt,
        // Suppression de checked_users qui n'est plus nécessaire
      })),
      position,
      size,
      color,
      pinned: true,
      user_name: penseBete.user_name // S'assurer que user_name est préservé
    };
    
    // Appeler onPin et attendre que la mise à jour soit terminée
    onPin(pinnedPenseBete)
      .then(() => {
        setIsEditing(false);
        window.location.reload();
      })
      .catch((err: Error) => {
        console.error('Erreur lors de l\'épinglage:', err);
      });
  };
  
  // Activer le mode édition
  const handleEdit = () => {
    if (penseBete.pinned) {
      // Désépingler le pense-bête pour permettre l'édition
      const unpinnedPenseBete = {
        ...penseBete,
        pinned: false
      };
      onUpdate(unpinnedPenseBete);
      setIsEditing(true);
    }
  };
  
  return (
    <div
      id={`pense-bete-${penseBete.id}`}
      ref={penseBeteRef}
      className={`absolute shadow-md rounded-lg overflow-hidden flex flex-col ${penseBete.target_element ? 'z-10' : ''} ${window.innerWidth < 650 ? 'mobile-pense-bete w-full' : ''}`}
      style={{
        left: `${window.innerWidth < 650 ? 0 : position.x}px`,
        top: `${position.y}px`,
        width: `${window.innerWidth < 650 ? '100%' : `${size.width}px`}`,
        height: `${size.height}px`,
        backgroundColor: 'white',
        border: `2px solid ${color}`,
        cursor: isDragging ? 'grabbing' : (isEditing ? 'grab' : 'default'),
        zIndex: isDragging || isResizing ? 100 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      {/* En-tête */}
      <div className="p-2 flex justify-between items-center border-b" style={{ borderColor: color }}>
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-none outline-none font-bold flex-grow text-sm"
            placeholder="Titre du pense-bête"
          />
        ) : (
          <h3 className="font-bold truncate text-sm">{title}</h3>
        )}
        
        <div className="flex items-center space-x-1">
          {/* Bouton de suppression */}
          {!penseBete.pinned && (
            <button
              onClick={() => onDelete && penseBete.id !== undefined && onDelete(penseBete.id)}
              className="text-gray-700 hover:text-red-500 p-1 rounded-full"
              title="Supprimer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {penseBete.pinned && (
            <button
              onClick={handleEdit}
              className="text-gray-700 hover:text-gray-900 p-1 rounded-full"
              title="Modifier"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Corps */}
      <div className="flex-grow p-3 overflow-y-auto">
        {/* Description */}
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent border border-gray-300 border-opacity-30 rounded p-2 mb-3 resize-none text-sm"
            placeholder="Description (optionnelle)"
            rows={Math.max(1, description.split('\n').length)} // Ajuster la hauteur en fonction du contenu
            style={{ minHeight: '3em' }} // Hauteur minimale
          />
        ) : (
          description && (
            <p className="mb-3 text-sm whitespace-pre-wrap break-all">
              {description.length > 700 
                ? description.substring(0, 700) + '...' 
                : description}
            </p>
          )
        )}
        
        {/* Options */}
        <div className="space-y-2">
          {options.length != 0 && (
            <h4 className="font-medium text-sm">To Do List:</h4>
          )}
          {options.map((option, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative mr-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={options[index].checkedUsers?.includes(penseBete.user_name || 'Utilisateur') || false}
                    onChange={(e) => {
                      e.stopPropagation(); // Empêcher la propagation de l'événement
                      handleOptionChange(index, e.target.checked);
                    }}
                    className="opacity-0 absolute h-5 w-5 cursor-pointer z-10"
                    id={`option-${penseBete.id}-${index}`}
                  />
                  <div 
                    className={`border-2 rounded-md h-5 w-5 flex flex-shrink-0 justify-center items-center ${options[index].checkedUsers?.includes(penseBete.user_name || 'Utilisateur') ? 'bg-amber-400 border-amber-400' : 'border-gray-300'}`}
                    style={{ borderColor: options[index].checkedUsers?.includes(penseBete.user_name || 'Utilisateur') ? color : undefined, backgroundColor: options[index].checkedUsers?.includes(penseBete.user_name || 'Utilisateur') ? color : 'white' }}
                    onClick={(e) => {
                      e.stopPropagation(); // Empêcher la propagation de l'événement
                      const input = document.getElementById(`option-${penseBete.id}-${index}`) as HTMLInputElement;
                      if (input) {
                        input.checked = !input.checked;
                        handleOptionChange(index, input.checked);
                      }
                    }}
                  >
                    <svg 
                      className={`fill-current w-3 h-3 text-white pointer-events-none ${options[index].checkedUsers?.includes(penseBete.user_name || 'Utilisateur') ? 'block' : 'hidden'}`} 
                      viewBox="0 0 20 20"
                    >
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  </div>
                </div>
                <label htmlFor={`option-${penseBete.id}-${index}`} className="text-sm whitespace-pre-wrap break-all">
                    {option.text}
                </label>
              </div>
              <div className="flex items-center">
                {option.checkedUsers && option.checkedUsers.length > 0 && (
                  <div className="text-xs text-gray-500 italic">
                    ✓ par {option.checkedUsers.join(', ')}
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="text-gray-600 hover:text-red-500 p-1 ml-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Ajouter une option */}
          {isEditing && (
            <div className="flex mt-2">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                className="flex-grow text-sm bg-transparent border border-gray-300 border-opacity-30 rounded-l p-1"
                placeholder="Nouveau to do"
                onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
              />
              <button
                onClick={handleAddOption}
                className="text-white px-2 rounded-r"
                style={{ backgroundColor: color }}
              >
                +
              </button>
            </div>
          )}
        </div>
        
        {/* Sélection de couleur */}
        {isEditing && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Couleur:</h4>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-gray-800' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={`Couleur ${c}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Pied de page */}
      <div className="p-2 border-t flex justify-between items-center" style={{ borderColor: color }}>
        {isEditing ? (
          <button
            onClick={handlePin}
            className="text-sm flex items-center px-3 py-1 rounded ml-auto text-white"
            style={{ backgroundColor: color }}
            title="Épingler (ne pourra plus être modifié)"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2H5V5zm6 1a1 1 0 10-2 0 1 1 0 002 0zm6 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8h14zm-3 5a1 1 0 10-2 0v3a1 1 0 102 0v-3z" />
            </svg>
            Épingler
          </button>
        ) : (
          <div className="text-xs text-gray-500 ml-auto">
            {penseBete.created_by && `Créé par ${penseBete.created_by}`}
          </div>
        )}
      </div>
      
      {/* Poignée de redimensionnement */}
      {(isEditing || !penseBete.pinned) && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 9h1v1h-1V9zm0 2h1v1h-1v-1zm0 2h1v1h-1v-1zm2-2h1v1h-1v-1zm0 2h1v1h-1v-1zm2-2h1v1h-1v-1zm0 2h1v1h-1v-1z" />
          </svg>
        </div>
      )}
    </div>
  );
}