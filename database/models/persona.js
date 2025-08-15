const Persona = require('../schemas/persona.schema')

// Create a Persona
const addPersona = async (obj) => {
  try {
    const persona = await Persona.create({ ...obj })
    return persona
  } catch (err) {
    err.message =
      err.code === 11000 ? 'Sorry, persona already exist!' : err.message

    throw new Error(err.message)
  }
}

// Find Personas
const findPersonas = async () => {
  try {
    const personas = await Persona.find().lean()
    return personas
  } catch (err) {
    throw new Error(err.message)
  }
}

// Find a Persona
const findPersona = async (obj) => {
  try {
    const found_persona = await Persona.findOne({ ...obj }).lean()
    return found_persona
  } catch (err) {
    throw new Error(err.message)
  }
}

// Update Persona
const updatePersona = async (obj, updatedObj) => {
  try {
    const updated_persona = await Persona.updateOne(
      { ...obj },
      { ...updatedObj }
    ).lean()
    return updated_persona
  } catch (err) {
    throw new Error(err.message)
  }
}

// Delete Persona
const deletePersona = async (obj) => {
  try {
    const deleted_persona = await Persona.deleteOne({ ...obj })
    return deleted_persona
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = { addPersona, findPersona, findPersonas, updatePersona, deletePersona }
