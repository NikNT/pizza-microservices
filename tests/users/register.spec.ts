import request from "supertest";
import app from "../../src/app";

describe("POST /auth/register", () => {
  describe("Given all fields", () => {
    it("should return 201", async () => {
      // AAA - Arrange, Act, Assert

      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert
      expect(response.status).toBe(201);
    });

    it("should return valid JSON response", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });

    it("should persist user in the database", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Act
      await request(app).post("/auth/register").send(userData);

      // Assert
    });
  });

  describe("Fields are missing", () => {});
});
