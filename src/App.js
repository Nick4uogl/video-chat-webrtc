import { BrowserRouter, Routes, Route } from "react-router-dom";
import Room from "./pages/Room/Room";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import NotFound404 from "./pages/NotFound404";
import RequireAuth from "./RequireAuth";
import "./App.css";
import Register from "./pages/Login/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/room/:id" element={<Room />} />
          <Route path="/" element={<Home />} />
        </Route>

        <Route path="/*" element={<NotFound404 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
