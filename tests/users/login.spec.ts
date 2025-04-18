import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { isJwt } from "../utils";

describe("POST /auth/login", () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    //Database truncation
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("should return 200", async () => {
      // Arrange

      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      const loginData = {
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Act
      await request(app).post("/auth/register").send(registerData);

      const response = await request(app).post("/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should contain access token and refresh token inside a cookie", async () => {
      // Arrange

      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      const loginData = {
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Act
      await request(app).post("/auth/register").send(registerData);

      const response = await request(app).post("/auth/login").send(loginData);

      interface Headers {
        ["set-cookie"]: string[];
      }
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessToken = cookie.split(";")[0].split("=")[1];
        }

        if (cookie.startsWith("refreshToken=")) {
          refreshToken = cookie.split(";")[0].split("=")[1];
        }
      });

      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();
      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return 400 is user does not exist", async () => {
      // Arrange
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: "one@example.com",
        password: "password123",
      };

      const loginData = {
        email: "two@example.com",
        password: "password123",
      };

      // Act
      await request(app).post("/auth/register").send(registerData);
      const response = await request(app).post("/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(400);
    });

    it("should return 400 if password is incorrect", async () => {
      // Arrange
      const registerData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      const loginData = {
        email: "vHb0g@example.com",
        password: "wrongPassword",
      };

      // Act
      await request(app).post("/auth/register").send(registerData);
      const response = await request(app).post("/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe("Missing fields", () => {
    it("should return 400 if email is missing", async () => {
      // Arrange
      const loginData = {
        email: "",
        password: "password123",
      };

      // Act
      const response = await request(app).post("/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(400);
    });

    it("should return 400 if password is missing", async () => {
      // Arrange
      const loginData = {
        email: "vHb0g@example.com",
        password: "",
      };

      // Act
      const response = await request(app).post("/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(400);
    });

    it("should return 400 if both email and password are missing", async () => {
      // Arrange
      const loginData = {
        email: "",
        password: "",
      };

      // Act
      const response = await request(app).post("/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(400);
    });
  });
});
