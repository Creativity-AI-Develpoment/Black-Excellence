import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import apiService from "../services/apiService";

function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiService.getEvents();
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="events-page">
      <h1 className="mb-4">Historical Events</h1>
      <Row>
        {events.map((event) => (
          <Col md={6} key={event.id}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>{event.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{event.year}</Card.Subtitle>
                <Card.Text>{event.description}</Card.Text>
                <Link to={`/events/${event.id}`}>
                  <Button variant="outline-primary">Learn More</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default EventsPage;
