import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "#routes/auth.route.js";
import userRoutes from "#routes/users.route.js"
import logger from "#config/logger.js";
import jwt from "jsonwebtoken";

// 🔹 建立完整的測試 App
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

describe("🔐 Auth Integration Tests", () => {
  let cookie; // 存 JWT
  
  test("POST /api/auth/init should init user table", async () => {
    const res = await request(app).post("/api/auth/init");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Init user table/);
  });

  test("POST /api/auth/sign-up should register user", async () => {
    const res = await request(app)
      .post("/api/auth/sign-up")
      .send({ name: "user", email: "user@test.com", password: "123456789", role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe("user@test.com");
    expect(res.headers["set-cookie"]).toBeDefined();

    cookie = res.headers["set-cookie"]; // Fetch JWT
  });

  test("POST /api/auth/sign-in should login user", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "user@test.com", password: "123456789" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("user@test.com");
    expect(res.headers["set-cookie"]).toBeDefined();

    cookie = res.headers["set-cookie"]; // Update cookie
  });

  test("POST /api/auth/sign-out should logout user", async () => {
    const res = await request(app).post("/api/auth/sign-out").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });

  test("POST /api/auth/del should exist", async () => {
    const res = await request(app).post("/api/auth/del");
    expect([200, 400, 500]).toContain(res.status);
  });
});

describe("Users Routes", () => {
    let userToken, adminToken;

    beforeAll(async () => {

        await request(app).post("/api/auth/init");

        await request(app).post("/api/auth/sign-up").send({
          name: "user",
          email: "user@test.com",
          password: "123456789",
          role: "user"
        });

        await request(app).post("/api/auth/sign-up").send({
          name: "admin",
          email: "admin@test.com",
          password: "123456789",
          role: "admin"
        });
  
        userToken = jwt.sign(
            { id: 1, email: "user@test.com", role: "user" },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
  
        adminToken = jwt.sign(
            { id: 2, email: "admin@test.com", role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
    });

    logger.info(`userToken: ${jwt.decode(userToken)}`);
    logger.info(`adminToken: ${jwt.decode(adminToken)}`);

    test("GET /api/users with token should return 200", async() => {
        const res = await request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message", "Successfully retrieved users");
        expect(Array.isArray(res.body.users)).toBe(true);
        expect(res.body).toHaveProperty("count");
    });

    test("GET /api/users/:id should return user details", async () => {
        const res = await request(app)
            .get("/api/users/1")
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("id");
    });

    test("PUT /api/users/:id as same user should failed", async () => {
        const res = await request(app)
            .put("/api/users/1")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ email: "user@apple.com" });
        
        expect(res.status).toBe(403);
    });

    test("PUT /api/users/:id as same admin should succeed", async () => {
        const res = await request(app)
            .put("/api/users/2")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ email: "admin@apple.com" });
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message", "User updated successfully");
    });

    test("DELETE /api/users/:id as normal user should fail", async () => {
        const res = await request(app)
            .delete("/api/users/1")
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(res.status).toBe(403);
    });

    test("DELETE /api/users/:id as admin should succeed", async () => {
        const res = await request(app)
            .delete("/api/users/1")
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect([200, 204]).toContain(res.status);
    });
});