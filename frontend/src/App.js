import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Container, Navbar, Nav, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import HomePage from "./pages/HomePage";
import FiguresPage from "./pages/FiguresPage";
import EventsPage from "./pages/EventsPage";
import FigureDetailPage from "./pages/FigureDetailPage";
import EventDetailPage from "./pages/EventDetailPage";
import MarketplacePage from "./pages/MarketplacePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import PrivateRoute from "./components/PrivateRoute";
import authService from "./services/authService";
import Cart from "./components/cart/Cart";

function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthed, setIsAuthed] = useState(authService.isAuthenticated());
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    setIsAuthed(authService.isAuthenticated());
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthed(false);
    navigate("/login");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Black Excellence History
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthed && (
              <>
                <Nav.Link as={Link} to="/home">
                  Home
                </Nav.Link>
                <Nav.Link as={Link} to="/figures">
                  Historical Figures
                </Nav.Link>
                <Nav.Link as={Link} to="/events">
                  Historical Events
                </Nav.Link>
                <Nav.Link as={Link} to="/marketplace">
                  Marketplace
                </Nav.Link>
                <Nav.Link as={Link} to="/subscription">
                  Subscription
                </Nav.Link>
              </>
            )}
          </Nav>
          <div className="d-flex gap-2">
            {isAuthed ? (
              <>
                <Button size="sm" variant="outline-light" onClick={() => setShowCart(true)}>
                  Cart
                </Button>
                <Button size="sm" variant="outline-light" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline-light" as={Link} to="/login">
                  Login
                </Button>
                <Button size="sm" variant="primary" as={Link} to="/signup">
                  Sign up
                </Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
      <Cart show={showCart} onHide={() => setShowCart(false)} />
    </Navbar>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <NavigationBar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Container className="py-4"><SignupPage /></Container>} />
          <Route path="/login" element={<Container className="py-4"><LoginPage /></Container>} />

          <Route element={<PrivateRoute />}>
            <Route
              path="/home"
              element={
                <Container className="py-4">
                  <HomePage />
                </Container>
              }
            />
            <Route
              path="/subscription"
              element={
                <Container className="py-4">
                  <SubscriptionPage />
                </Container>
              }
            />
            <Route
              path="/figures"
              element={
                <Container className="py-4">
                  <FiguresPage />
                </Container>
              }
            />
            <Route
              path="/figures/:id"
              element={
                <Container className="py-4">
                  <FigureDetailPage />
                </Container>
              }
            />
            <Route
              path="/events"
              element={
                <Container className="py-4">
                  <EventsPage />
                </Container>
              }
            />
            <Route
              path="/events/:id"
              element={
                <Container className="py-4">
                  <EventDetailPage />
                </Container>
              }
            />
            <Route
              path="/marketplace"
              element={
                <Container fluid className="px-0">
                  <MarketplacePage />
                </Container>
              }
            />
            <Route
              path="/marketplace/:id"
              element={
                <Container fluid className="px-0">
                  <ProductDetailPage />
                </Container>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
