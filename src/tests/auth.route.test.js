import request from "supertest";
import express from "express";
import authRoutes from "#routes/auth.route.js";

// 🔹 mock controller
jest.mock("#controllers/auth.controller.js", () => {
  return {
    signup: (req, res) =>
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: 1,
          name: req.body.name || "test",
          email: req.body.email || "test@test.com",
          role: req.body.role || "user",
        },
      }),
    signin: (req, res) =>
      res.status(200).json({
        message: "Login successful",
        user: {
          id: 1,
          name: "test",
          email: req.body.email || "test@test.com",
          role: "user",
        },
      }),
    signout: (req, res) => res.status(200).json({ message: "Logged out successfully" }),
    initUserTable: (req, res) => res.status(200).json({ message: "Init user table successfully" }),
    deleteUserTable: (req, res) => res.status(200).json({ message: "Delete user table successfully" }),
  };
});

// 🔹 設置測試用 Express app
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth Routes", () => {
  test("POST /api/auth/sign-up should register a user", async () => {
    const res = await request(app)
      .post("/api/auth/sign-up")
      .send({ name: "Evan", email: "evan@test.com", password: "1234", role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe("evan@test.com");
  });

  test("POST /api/auth/sign-in should login a user", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "evan@test.com", password: "1234" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.user).toHaveProperty("email", "evan@test.com");
  });

  test("POST /api/auth/sign-out should logout a user", async () => {
    const res = await request(app).post("/api/auth/sign-out");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });

  test("POST /api/auth/init should init user table", async () => {
    const res = await request(app).post("/api/auth/init");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Init user table successfully");
  });

  test("POST /api/auth/del should delete user table", async () => {
    const res = await request(app).post("/api/auth/del");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Delete user table successfully");
  });
});
