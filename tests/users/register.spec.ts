import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";

describe("POST /auth/register", () => {
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
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users.length).toBe(1);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
      expect(users[0].email).toBe(userData.email);
    });

    it("should return id of the created user", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      const userRepository = connection.getRepository(User);
      await userRepository.find();

      expect(response.body).toHaveProperty("id");
    });

    it("should assign a customer role", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      //Act
      await request(app).post("/auth/register").send(userData);

      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0]).toHaveProperty("role");
      expect(users[0].role).toBe(Roles.CUSTOMER);
    });

    it("should store the hashed password in the database", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      //Act
      await request(app).post("/auth/register").send(userData);

      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find({
        select: ["password"],
      });

      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it("should return 400 if email is already in use", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: Roles.CUSTOMER });

      //Act
      const response = await request(app).post("/auth/register").send(userData);
      const users = await userRepository.find();

      //Assert
      expect(response.status).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return access token and refresh token inside a cookie", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
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
    });

    it("should store the refresh token in the database", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      const refreshTokenRepo = connection.getRepository(RefreshToken);
      await refreshTokenRepo.find();

      const tokens = await refreshTokenRepo
        .createQueryBuilder("refreshToken")
        .where("refreshToken.userId = :userId", {
          userId: (response.body as Record<string, string>).id,
        })
        .getMany();

      expect(tokens).toHaveLength(1);
    });
  });

  describe("Fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.status).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });

    it("should return 400 status code if firstName field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.status).toBe(400);
    });
    it("should return 400 status code if lastName field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "",
        email: "vHb0g@example.com",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.status).toBe(400);
    });
    it("should return 400 status code if password field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.status).toBe(400);
    });
  });

  describe("Fields are in invalid format", () => {
    it("should trim the email field", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: " dvHb0g@example.com ",
        password: "password123",
      };

      //Act
      await request(app).post("/auth/register").send(userData);

      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      const user = users[0];

      expect(user.email).toBe("dvHb0g@example.com");
    });

    it("should return 400 status code if email is invalid", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.status).toBe(400);
    });

    it("should return 400 status code if password length is less than 8 characters", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "short",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.status).toBe(400);
    });

    it("should return an array of error messages if email is missing", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "",
        password: "password123",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });
});
