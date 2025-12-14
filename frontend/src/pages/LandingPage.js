import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero py-5 text-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={7}>
              <p className="text-uppercase mb-2 fw-semibold">Black Excellence</p>
              <h1 className="display-4 fw-bold mb-3">
                Discover, learn, and celebrate Black history together.
              </h1>
              <p className="lead mb-4">
                Access curated stories of historical figures and events, and unlock
                deeper content with a free account.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Button as={Link} to="/signup" variant="light" size="lg">
                  Create free account
                </Button>
                <Button as={Link} to="/login" variant="outline-light" size="lg">
                  Sign in
                </Button>
              </div>
            </Col>
            <Col lg={5} className="mt-4 mt-lg-0">
              <Card className="shadow-lg">
                <Card.Body>
                  <h5 className="fw-semibold mb-3">What you’ll find inside</h5>
                  <ul className="mb-0 ps-3">
                    <li>Profiles of iconic figures with key achievements</li>
                    <li>Historic events with context and significance</li>
                    <li>AI-powered Q&A to deepen understanding</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="py-5">
        <Container>
          <Row className="gy-4">
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold">Curated Knowledge</h5>
                  <p className="mb-0">
                    Learn from organized collections of figures, events, and themes.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold">Guided Journeys</h5>
                  <p className="mb-0">
                    Follow timelines that link people, movements, and ideas.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold">Ask the AI Historian</h5>
                  <p className="mb-0">
                    Get context-aware answers that respect cultural nuance.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default LandingPage;
