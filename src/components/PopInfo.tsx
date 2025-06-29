import { useState} from 'react';

interface PopInfoProps {
  onClose: () => void;
  onHideInfoIcon?: () => void; // Nouvelle prop pour mettre à jour l'état dans le parent
}

export default function PopInfo({ onClose, onHideInfoIcon }: PopInfoProps) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const handleClose = () => {
    if (doNotShowAgain) {
      localStorage.setItem('hideInfoIcon', 'true');
      // Appeler la fonction du parent pour cacher l'icône immédiatement
      if (onHideInfoIcon) {
        onHideInfoIcon();
      }
    }
    onClose();
  };

  const handleReportBug = () => {
    window.location.href = 'mailto:contact@capiomont.fr?subject=Signalement%20de%20bug%20-%20mespensebetes';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative animate-fadeIn">
        {/* Bouton de fermeture (X) */}
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Contenu du popup */}
        <div className="text-center mb-6">
          <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Information</h3>
          <p className="text-gray-600 mb-4">Ce site est actuellement en cours de développement.</p>
        </div>
        
        {/* Bouton pour signaler un bug */}
        <button
          onClick={handleReportBug}
          className="w-full bg-amber-400 text-white py-2 px-4 rounded-md hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 mb-4"
        >
          Signaler un bug
        </button>
        
        {/* Option pour ne plus afficher */}
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            id="doNotShowAgain"
            checked={doNotShowAgain}
            onChange={(e) => setDoNotShowAgain(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="doNotShowAgain" className="text-sm text-gray-600">
            Merci de l'info, ne pas me rappeler
          </label>
        </div>
      </div>
    </div>
  );
}