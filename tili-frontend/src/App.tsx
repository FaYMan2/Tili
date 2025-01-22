
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { isLoggedInAtom, usernameAtom } from './utils/atom';
import { useEffect } from 'react';
import { useAtom } from 'jotai';


import Dashboard from './pages/Dashboard';

function App() {
  const [, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [, setUsername] = useAtom(usernameAtom);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const accessToken = localStorage.getItem("access_token");

    if (storedUsername && accessToken) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, [setIsLoggedIn, setUsername]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
