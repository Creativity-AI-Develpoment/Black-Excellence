import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import marketplaceService from "../services/marketplaceService";
import cartService from "../services/cartService";

function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await marketplaceService.getProducts();
      const cats = await marketplaceService.getMarketplaceCategories();
      setProducts(data);
      if (cats?.categories) {
        setCategories(["All", ...cats.categories]);
      } else {
        const derived = Array.from(new Set(data.map((p) => p.category)));
        setCategories(["All", ...derived]);
      }
    } catch (err) {
      setError("Could not load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (id) => {
    setMessage("");
    setError("");
    try {
      const res = await marketplaceService.purchaseProduct(id);
      setMessage(res.message || "Order created.");
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stock_quantity: res.remaining_stock ?? p.stock_quantity - 1 } : p
        )
      );
    } catch (err) {
      const detail = err.response?.data?.detail || "Purchase failed.";
      setError(detail);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    setMessage("");
    setError("");
    try {
      const res = await cartService.addToCart(productId, 1);
      setMessage(res.message || "Added to cart.");
    } catch (err) {
      const detail = err.response?.data?.detail || "Could not add to cart.";
      setError(detail);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-3">
        <div>
          <h1 className="mb-0">Marketplace</h1>
          <p className="text-muted mb-0">Support Black creators and discover curated products.</p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ minWidth: "160px" }}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Form.Select>
          <Form.Control
            type="search"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row className="gy-4">
          {products
            .filter((product) => {
              const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
              const term = searchTerm.toLowerCase();
              const matchesSearch =
                !term ||
                product.name.toLowerCase().includes(term) ||
                product.description.toLowerCase().includes(term) ||
                (product.tags || []).some((tag) => tag.toLowerCase().includes(term));
              return matchesCategory && matchesSearch;
            })
            .map((product) => (
            <Col md={6} lg={4} key={product.id}>
              <Card className="h-100 shadow-sm">
                {(product.image_urls && product.image_urls.length > 0) && (
                  <Card.Img
                    variant="top"
                    src={product.image_urls[0]}
                    alt={product.name}
                    style={{ height: "180px", objectFit: "cover" }}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <div className="mb-2">
                    <div className="text-uppercase text-muted small">{product.category}</div>
                    <Card.Title as={Link} to={`/marketplace/${product.id}`} className="stretched-link text-decoration-none">
                      {product.name}
                    </Card.Title>
                    <Card.Text className="text-muted" style={{ minHeight: "70px" }}>
                      {product.description}
                    </Card.Text>
                    <div className="mb-2">
                      {(product.tags || []).slice(0, 3).map((tag) => (
                        <Badge key={tag} bg="light" text="dark" className="me-1">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <div>
                      <strong>${product.price.toFixed(2)}</strong>
                      <div className="small text-muted">Stock: {product.stock_quantity}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/marketplace/${product.id}`}
                        variant="outline-secondary"
                        size="sm"
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={product.stock_quantity <= 0}
                        onClick={() => handleAddToCart(product.id)}
                      >
                        {product.stock_quantity > 0 ? "Add to cart" : "Sold out"}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {!products.length && !loading && (
            <Col>
              <div className="text-center text-muted py-5">No products found.</div>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
}

export default MarketplacePage;
