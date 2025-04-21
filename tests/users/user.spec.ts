import request from "supertest";
import { createJWKSMock, JWKSMock } from "mock-jwks";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("GET /auth/self", () => {
  let connection: DataSource;
  let jwks: JWKSMock;
  let stopJWKS: () => void;

  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    stopJWKS = jwks.start();

    //Database truncation
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterEach(() => {
    stopJWKS();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  const endpoint: string = "/auth/self";
  async function callEndpoint() {
    return await request(app).get(endpoint);
  }

  describe("Given all fields", () => {
    it("should return 200", async () => {
      const accessToken = jwks.token({
        sub: "1",
        role: Roles.CUSTOMER,
      });
      const response = await request(app)
        .get(endpoint)
        .set("Cookie", [`accessToken=${accessToken};`]);
      expect(response.status).toBe(200);
    });

    it("should return user data", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Register user
      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      });

      const accessToken = jwks.token({
        sub: String(data.id),
        role: data.role,
      });

      const response = await request(app)
        .get(endpoint)
        .set("Cookie", [`accessToken=${accessToken};`]);

      expect((response.body as Record<string, string>).id).toBe(data.id);

      await callEndpoint();
    });

    it("should not return password", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Register user
      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      });

      const accessToken = jwks.token({
        sub: String(data.id),
        role: data.role,
      });

      const response = await request(app)
        .get(endpoint)
        .set("Cookie", [`accessToken=${accessToken};`]);

      expect(response.body as Record<string, string>).not.toHaveProperty(
        "password",
      );
    });

    it("should return 401 if token does not exists", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "vHb0g@example.com",
        password: "password123",
      };

      // Register user
      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      });

      const response = await request(app).get(endpoint);

      expect(response.status).toBe(401);
    });
  });
});
