import React from "react";
import useStore from "./store/store";
import { Outlet, Navigate } from "react-router-dom";

const RequireAuth = () => {
  const username = useStore((state) => state.username);
  if (!localStorage.getItem("username")) {
    return <Navigate to="/login" />;
  }
  return <Outlet />;
};

export default RequireAuth;
