import { Routes, Route } from "react-router-dom";
import { useAuth } from "./auth/useAuth";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Me from "./pages/me/Me";
import Restaurants from "./pages/public/Restaurants";

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/me" element={<Me />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="*" element={<h1>404</h1>} />
    </Routes>
  );
}
