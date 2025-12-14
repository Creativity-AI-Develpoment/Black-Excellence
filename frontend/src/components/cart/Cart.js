import React, { useEffect, useState } from "react";
import { Modal, Button, Row, Col, Form, Card, Alert } from "react-bootstrap";
import cartService from "../../services/cartService";

function Cart({ show, onHide, onCheckout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCart = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await cartService.getCart();
      setItems(data);
    } catch (err) {
      setError("Unable to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      loadCart();
    }
  }, [show]);

  const updateQuantity = async (itemId, quantity) => {
    try {
      await cartService.updateCartItem(itemId, quantity);
      loadCart();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update item.");
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartService.removeCartItem(itemId);
      loadCart();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to remove item.");
    }
  };

  const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const handleCheckout = async () => {
    setError("");
    setMessage("");
    try {
      const session = await cartService.createCheckoutSession();
      if (session.checkout_url) {
        window.location.href = session.checkout_url;
      } else {
        setMessage("Checkout session created, but no redirect URL provided.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to start checkout.");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Cart</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {items.map((item) => (
              <Card key={item.id} className="mb-3">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={2}>
                      {item.product.image_urls && item.product.image_urls.length > 0 && (
                        <img
                          src={item.product.image_urls[0]}
                          alt={item.product.name}
                          style={{ width: "100%", height: "80px", objectFit: "cover" }}
                        />
                      )}
                    </Col>
                    <Col md={4}>
                      <div className="fw-semibold">{item.product.name}</div>
                      <div className="text-muted">${item.product.price?.toFixed(2)}</div>
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0 mt-1"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </Col>
                    <Col md={3} className="text-end">
                      <div className="fw-semibold">${item.subtotal?.toFixed(2)}</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Total: ${total.toFixed(2)}</h5>
              <Button variant="primary" onClick={handleCheckout}>
                Place Order
              </Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default Cart;
