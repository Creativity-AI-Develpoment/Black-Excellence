import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Badge, Button } from "react-bootstrap";
import apiService from "../services/apiService";

function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await apiService.getEvent(id);
        setEvent(response.data);
      } catch (err) {
        setError("Event not found");
      }
    };

    fetchEvent();
  }, [id]);

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <div className="event-detail">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">{event.title}</Card.Title>
            <Badge bg="info">{event.year}</Badge>
          </div>
          <Card.Subtitle className="mb-3 text-muted">{event.location}</Card.Subtitle>
          <Card.Text>{event.description}</Card.Text>
          <div className="mt-4">
            <h5>Significance</h5>
            <p>{event.significance}</p>
          </div>
          <div className="mt-3">
            <h6>Key Figures</h6>
            <ul>
              {event.key_figures.map((figure, idx) => (
                <li key={idx}>{figure}</li>
              ))}
            </ul>
          </div>
          <Link to="/events">
            <Button variant="outline-dark" className="mt-3">
              Back to Events
            </Button>
          </Link>
        </Card.Body>
      </Card>
    </div>
  );
}

export default EventDetailPage;
