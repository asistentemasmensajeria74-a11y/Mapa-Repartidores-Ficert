import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure body parsers for handling incoming POST forms and JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API router / Proxy for Sheets
  app.all("/api/sheets", async (req, res) => {
    try {
      const targetUrl = "https://script.google.com/macros/s/AKfycbx_aBWgPzdKEWqiEFSuzyYZ95Lvc23ijU8dNqy8eckShQfL1oryFGKx1fIOThhFlXEs/exec";
      const url = new URL(targetUrl);

      // Merge current query parameters
      for (const [key, val] of Object.entries(req.query)) {
        if (val !== undefined) {
          url.searchParams.set(key, String(val));
        }
      }

      // Merge body parameters
      if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
        for (const [key, val] of Object.entries(req.body)) {
          if (val !== undefined) {
            url.searchParams.set(key, String(val));
          }
        }
      }

      const currentMethod = req.method;
      let currentHeaders: Record<string, string> = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ServerProxy/1.0",
      };
      let currentBody: any = undefined;

      if (currentMethod !== "GET" && currentMethod !== "HEAD") {
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
          currentBody = JSON.stringify(req.body);
          currentHeaders["Content-Type"] = "application/json";
        } else {
          // Default to application/x-www-form-urlencoded
          const params = new URLSearchParams();
          if (req.body && typeof req.body === "object") {
            for (const [key, val] of Object.entries(req.body)) {
              params.append(key, String(val));
            }
          }
          currentBody = params.toString();
          currentHeaders["Content-Type"] = "application/x-www-form-urlencoded";
        }
      }

      const finalUrl = url.toString();
      console.log(`[PROXY] Forwarding ${currentMethod} request to Google Apps Script: ${finalUrl}`);

      const response = await fetch(finalUrl, {
        method: currentMethod,
        headers: currentHeaders,
        body: currentBody,
        redirect: "follow", // Native Node fetch handles 302/303 redirect seamlessly!
      });

      console.log(`[PROXY] Final target returned status: ${response.status}`);
      const responseText = await response.text();

      // Set forwarding headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // Attempt parsing response as JSON, fallback to plain text if structured differently
      try {
        const json = JSON.parse(responseText);
        res.status(response.status).json(json);
      } catch {
        res.status(response.status).send(responseText);
      }
    } catch (error: any) {
      console.error("[CORS Proxy Error]", error);
      res.status(500).json({ success: false, message: "Internal proxy server error: " + error.message });
    }
  });

  // Serve static files and handle Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-stack proxy server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
