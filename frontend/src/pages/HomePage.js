import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import apiService from "../services/apiService";

function HomePage() {
  const [featuredFigures, setFeaturedFigures] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const figuresResponse = await apiService.getFigures();
        const eventsResponse = await apiService.getEvents();

        setFeaturedFigures(figuresResponse.data.slice(0, 3));
        setFeaturedEvents(eventsResponse.data.slice(0, 2));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleAsk = async (e) => {
    e.preventDefault();
    setAiError("");
    setAnswer("");
    if (!question.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiService.askAI(question.trim());
      setAnswer(res.data.response);
    } catch (err) {
      const detail = err.response?.data?.detail || "Something went wrong. Please try again.";
      setAiError(detail);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section text-center mb-5">
        <h1 className="display-4 text-primary">Black Excellence in History</h1>
        <p className="lead">
          Celebrating the achievements and contributions of Black historical figures
        </p>
      </div>

      <section className="featured-figures mb-5">
        <h2 className="mb-4">Featured Historical Figures</h2>
        <Row>
          {featuredFigures.map((figure) => (
            <Col md={4} key={figure.id}>
              <Card className="mb-4">
                <Card.Img
                  variant="top"
                  src={
                    figure.image_url ||
                    `https://via.placeholder.com/300x200?text=${figure.name}`
                  }
                  alt={figure.name}
                />
                <Card.Body>
                  <Card.Title>{figure.name}</Card.Title>
                  <Card.Text>
                    <strong>{figure.profession}</strong>
                    <br />
                    {figure.birth_year} - {figure.death_year || "Present"}
                  </Card.Text>
                  <Card.Text>{figure.biography.substring(0, 100)}...</Card.Text>
                  <Link to={`/figures/${figure.id}`}>
                    <Button variant="primary">Learn More</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="featured-events">
        <h2 className="mb-4">Historical Events</h2>
        <Row>
          {featuredEvents.map((event) => (
            <Col md={6} key={event.id}>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>{event.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {event.year}
                  </Card.Subtitle>
                  <Card.Text>{event.description}</Card.Text>
                  <Link to={`/events/${event.id}`}>
                    <Button variant="outline-primary">Read More</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="ai-widget mt-5">
        <h2 className="mb-3">Ask the Historian (AI)</h2>
        <p className="text-muted">Ask a question about Black Excellence, figures, or events.</p>
        <form onSubmit={handleAsk}>
          <Row className="g-3">
            <Col md={9}>
              <textarea
                className="form-control"
                rows="3"
                placeholder="e.g., Tell me about Bayard Rustin's role in the March on Washington."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </Col>
            <Col md={3} className="d-flex align-items-start">
              <Button type="submit" variant="primary" className="w-100" disabled={aiLoading}>
                {aiLoading ? "Thinking..." : "Ask"}
              </Button>
            </Col>
          </Row>
        </form>
        {aiError && <div className="text-danger mt-2">{aiError}</div>}
        {answer && (
          <Card className="mt-3">
            <Card.Body>
              <Card.Title>Response</Card.Title>
              <Card.Text>{answer}</Card.Text>
            </Card.Body>
          </Card>
        )}
      </section>
    </div>
  );
}

export default HomePage;
