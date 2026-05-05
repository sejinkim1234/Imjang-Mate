import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MapPage } from './pages/MapPage';
import { ListPage } from './pages/ListPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { LoginPage } from './pages/LoginPage';
import { usePropertyStore } from './store/usePropertyStore';

function App() {
  const familyCode = usePropertyStore((state) => state.familyCode);

  if (!familyCode) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MapPage />} />
          <Route path="list" element={<ListPage />} />
          <Route path="checklist" element={<ChecklistPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
