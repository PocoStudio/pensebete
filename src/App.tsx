import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ViewListPage from './pages/view-list/ViewListPage';
import ListDetailPage from './pages/list-detail/ListDetailPage';
import AccessPage from './pages/access/AccessPage';
import DashboardPage from './pages/dashboard/DashboardPage';

function StandardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <header className="flex-shrink-0 bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200">
        <div className="w-full">
          <h1 className="text-2xl font-bold">Mes Pense-bêtes</h1>
        </div>
      </header>
      
      <main className="flex-1 bg-white overflow-auto">
        {children}
      </main>
      
      <footer className="flex-shrink-0 bg-white text-gray-600 p-4 border-t border-gray-200">
        <div className="w-full text-center">
          <p>&copy; 2025 Mes Pense-bêtes</p>
        </div>
      </footer>
    </div>
  );
}

function FullScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {children}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="w-full h-full">
        <Routes>
          <Route path="/dashboard/:id" element={
            <FullScreenLayout>
              <DashboardPage />
            </FullScreenLayout>
          } />
          <Route path="*" element={
            <StandardLayout>
              <Routes>
                <Route path="/" element={<ViewListPage />} />
                <Route path="/list/:id" element={<ListDetailPage />} />
                <Route path="/access/:id" element={<AccessPage />} />
              </Routes>
            </StandardLayout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;