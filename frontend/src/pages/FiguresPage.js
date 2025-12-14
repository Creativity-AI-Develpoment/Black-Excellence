import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import apiService from "../services/apiService";

function FiguresPage() {
  const [figures, setFigures] = useState([]);
  const [filteredFigures, setFilteredFigures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const figuresResponse = await apiService.getFigures();
        const categoriesResponse = await apiService.getCategories();

        setFigures(figuresResponse.data);
        setFilteredFigures(figuresResponse.data);
        setCategories(["All", ...categoriesResponse.data.categories]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredFigures(figures);
    } else {
      setFilteredFigures(
        figures.filter((figure) => figure.category === selectedCategory)
      );
    }
  }, [selectedCategory, figures]);

  return (
    <div className="figures-page">
      <h1 className="mb-4">Historical Figures</h1>

      <Form.Group className="mb-4">
        <Form.Label>Filter by Category:</Form.Label>
        <Form.Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Row>
        {filteredFigures.map((figure) => (
          <Col md={6} lg={4} key={figure.id}>
            <Card className="mb-4">
              <Card.Img
                variant="top"
                src={
                  figure.image_url ||
                  `https://via.placeholder.com/300x200?text=${figure.name}`
                }
                alt={figure.name}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <Card.Body>
                <Card.Title>{figure.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {figure.profession} • {figure.birth_year} - {figure.death_year || "Present"}
                </Card.Subtitle>
                <Card.Text>{figure.biography.substring(0, 150)}...</Card.Text>
                <div className="mb-2">
                  <strong>Key Achievements:</strong>
                  <ul>
                    {figure.achievements.slice(0, 2).map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </div>
                <Link to={`/figures/${figure.id}`}>
                  <Button variant="primary">View Full Profile</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default FiguresPage;
