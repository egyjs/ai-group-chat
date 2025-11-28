import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

import Home from './pages/Home';
import ChatRoom from './pages/ChatRoom';
import JoinRoom from './pages/JoinRoom';

// Protected Route Component
const PrivateRoute = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  return currentUser ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Home />}>
                <Route path="room/:roomId" element={<ChatRoom />} />
              </Route>
              <Route path="join/:roomId" element={<JoinRoom />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
