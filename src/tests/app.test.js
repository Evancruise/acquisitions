import request from "supertest";
import app from '#src/app.js';
import jwt from "jsonwebtoken";

describe('API Endpoints', () => {
    test("GET / should return Hello from Acquisitions", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toBe("Hello from Acquisitions");
    });
    
    test('GET /health should return status OK', async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("OK");
        expect(res.body.timestamp).toBeDefined();
        expect(typeof res.body.uptime).toBe("number");
    });

    test('GET /api should return Acquisitions API is running!', async () => {
        const res = await request(app).get("/api");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Acquisitions API is running!" });
    });

    test("GET /unknown should return 404 Route not found", async () => {
        const res = await request(app).get("/unknown");
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Route not found" });
    });
});