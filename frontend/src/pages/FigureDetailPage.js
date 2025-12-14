import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Badge, Button } from "react-bootstrap";
import apiService from "../services/apiService";

function FigureDetailPage() {
  const { id } = useParams();
  const [figure, setFigure] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFigure = async () => {
      try {
        const response = await apiService.getFigure(id);
        setFigure(response.data);
      } catch (err) {
        setError("Figure not found");
      }
    };

    fetchFigure();
  }, [id]);

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  if (!figure) {
    return <div>Loading...</div>;
  }

  return (
    <div className="figure-detail">
      <Card>
        <Card.Img
          variant="top"
          src={
            figure.image_url ||
            `https://via.placeholder.com/600x300?text=${figure.name}`
          }
          alt={figure.name}
          style={{ maxHeight: "320px", objectFit: "cover" }}
        />
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">{figure.name}</Card.Title>
            <Badge bg="secondary">{figure.category}</Badge>
          </div>
          <Card.Subtitle className="mb-3 text-muted">
            {figure.profession} • {figure.birth_year} - {figure.death_year || "Present"}
          </Card.Subtitle>
          <Card.Text>{figure.biography}</Card.Text>
          <div className="mt-4">
            <h5>Key Achievements</h5>
            <ul className="achievement-list">
              {figure.achievements.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <Link to="/figures">
            <Button variant="outline-dark" className="mt-3">
              Back to Figures
            </Button>
          </Link>
        </Card.Body>
      </Card>
    </div>
  );
}

export default FigureDetailPage;
