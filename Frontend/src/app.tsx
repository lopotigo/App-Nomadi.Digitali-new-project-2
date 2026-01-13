import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import AuthPage from "./AuthPage";
import EventNavigator from "./EventNavigator";

export default function App() {
  return (
    <>
      <EventNavigator />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </>
  );
}