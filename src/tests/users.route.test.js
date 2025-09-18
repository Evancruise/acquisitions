import request from "supertest";
import express from "express";
import userRoutes from "#routes/users.route.js";

// 🔹 設置測試用 Express app
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("Users Routes", () => {
    let userToken, adminToken;

    beforeAll(() => {
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

    test("GET /api/users with token should return 200", async() => {
        const res = await request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("GET /api/users/:id should return user details", async () => {
        const res = await request(app)
            .get("/api/users/1")
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("id");
    });

    test("PUT /api/users/:id as same user should succeed", async () => {
        const res = await request(app)
            .put("/api/users/1")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ name: "Updated User" });
        
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Update User");
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