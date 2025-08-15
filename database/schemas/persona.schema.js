const mongoose = require('mongoose')
const { Schema } = mongoose

const personaSchema = new Schema(
    {
        username: { type: String, required: true },
        password: { type: String, required: true },
        ip: { type: String },
        city: { type: String },
        region: { type: String },
        countryName: { type: String },
        countryCode: { type: String },
        user_agent: { type: String },
        date: { type: String, required: true },
        time: { type: String, required: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

module.exports = mongoose.model('persona', personaSchema)