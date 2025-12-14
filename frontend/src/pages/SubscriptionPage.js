import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import subscriptionService from "../services/subscriptionService";

function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await subscriptionService.getPlans();
      setPlans(data);
    } catch (err) {
      setError("Unable to load plans right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id) => {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await subscriptionService.selectPlan(id);
      setMessage(res.message || "Plan selected.");
    } catch (err) {
      const detail = err.response?.data?.detail || "Could not select plan.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <Container className="py-4">
      <h1 className="mb-4">Choose your plan</h1>
      <p className="text-muted">This is a skeleton—no billing yet. Selecting a plan only updates your profile tier.</p>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="gy-4">
        {plans.map((plan) => (
          <Col md={4} key={plan.id}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title className="mb-0">{plan.name}</Card.Title>
                  <small className="text-uppercase text-muted">{plan.interval}</small>
                </div>
                <div className="fs-4 fw-semibold mb-2">
                  {plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}`}
                  <span className="text-muted fs-6"> /mo</span>
                </div>
                <Card.Text className="text-muted">{plan.description}</Card.Text>
                <ul className="mb-4">
                  {plan.features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
                <Button
                  variant="primary"
                  className="mt-auto"
                  onClick={() => handleSelect(plan.id)}
                  disabled={loading}
                >
                  {plan.price === 0 ? "Stay on Free" : "Select"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
        {!plans.length && !loading && (
          <Col>
            <div className="text-muted">No plans available.</div>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default SubscriptionPage;
