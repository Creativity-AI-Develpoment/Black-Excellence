import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, Alert, Badge, Spinner } from "react-bootstrap";
import marketplaceService from "../services/marketplaceService";
import cartService from "../services/cartService";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProduct = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await marketplaceService.getProduct(id);
      setProduct(data);
    } catch (err) {
      const detail = err.response?.data?.detail || "Product not found.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setError("");
    setMessage("");
    try {
      const res = await cartService.addToCart(id, 1);
      setMessage(res.message || "Added to cart.");
    } catch (err) {
      const detail = err.response?.data?.detail || "Add to cart failed.";
      setError(detail);
    }
  };

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </Container>
    );
  }

  if (!product) return null;

  return (
    <Container className="py-4">
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="gy-4">
        <Col md={6}>
          <Card className="shadow-sm">
            {product.image_urls && product.image_urls.length > 0 ? (
              <Card.Img
                variant="top"
                src={product.image_urls[0]}
                alt={product.name}
                style={{ maxHeight: "340px", objectFit: "cover" }}
              />
            ) : null}
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Badge bg="secondary" className="text-uppercase">
                  {product.category}
                </Badge>
              </div>
              <Card.Title className="mb-2">{product.name}</Card.Title>
              <Card.Text className="text-muted flex-grow-1">{product.description}</Card.Text>
              <div className="mb-3">
                {(product.tags || []).map((tag) => (
                  <Badge key={tag} bg="light" text="dark" className="me-1">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <div className="d-flex justify-content-between align-items-center mt-auto">
                <div>
                  <div className="fs-4 fw-semibold">${product.price.toFixed(2)}</div>
                  <div className="text-muted small">Stock: {product.stock_quantity}</div>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={product.stock_quantity <= 0}
                  onClick={handlePurchase}
                >
                  {product.stock_quantity > 0 ? "Purchase" : "Sold out"}
                </Button>
              </div>
              <div className="mt-3">
                <Link to="/marketplace">Back to marketplace</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductDetailPage;
