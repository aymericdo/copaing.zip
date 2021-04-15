import express from 'express';
import fs from 'fs'
import { initializeObjects, createNewAppointment, createNewPatient, editNewPatient } from './data.js'
const app = express()

const port = 3008
app.use(express.json())

initializeObjects()


function pagination(arr, perPage, page) {
  if (!perPage) {
    perPage = 50;
  }
  if (!page) {
    page = 1
  }

  let chunks = [], i = 0, n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, i += perPage));
  }
  return chunks[page - 1];
}

// Routes
app.post('/authorization', (req, res) => {
  res.status(200).json({ access_token: 'azerty', expires_in: 900000 })
})

// Appointment routes
app.post('/appointments', (req, res) => {
  const appointment = req.body
  const newAppointment = createNewAppointment(appointment)
  freshAppointments.push(newAppointment)

  const data = JSON.stringify(freshAppointments);
  fs.writeFileSync('appointments.json', data);

  res.status(200).json(newAppointment)
})

app.delete('/appointments/:appointmentId', (req, res) => {
  const appointmentId = req.params.appointmentId;

  const data = JSON.stringify(freshAppointments.filter(a => a.id !== appointmentId));
  fs.writeFileSync('appointments.json', data);

  res.status(200).json({})
})

app.get('/appointments/:appointmentId', (req, res) => {
  const appointmentId = req.params.appointmentId;
  res.status(200).json(freshAppointments.find(a => a.id === appointmentId))
})

// Availability routes
app.get('/availabilities', (req, res) => {
  const perPage = req.query.per_page;
  const page = req.query.page;
  const availabilitiesToReturn = freshAvailabilities
  res.header('X-total-count', availabilitiesToReturn.length)
  res.status(200).json(pagination(freshAvailabilities, +perPage, +page))
})

app.get('/availabilities/:availabilityId', (req, res) => {
  const availabilityId = req.params.availabilityId;
  res.status(200).json(freshAvailabilities.find(a => a.id === availabilityId));
})

// Patient routes
app.post('/patients', (req, res) => {
  const patient = req.body
  const newPatient = createNewPatient(patient)
  freshPatients.push(newPatient)
  
  const data = JSON.stringify(freshPatients);
  fs.writeFileSync('patients.json', data);

  res.status(200).json(newPatient)
})

app.get('/patients', (req, res) => {
  const perPage = req.query.per_page;
  const page = req.query.page;
  res.header('X-total-count', freshPatients.length)
  res.status(200).json(pagination([...freshPatients], +perPage, +page))
})

app.patch('/patients/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const newPatient = req.body

  let editPatient = freshPatients.find(p => p.id === patientId)
  editPatient = editNewPatient(editPatient, newPatient)

  // replace the edited patient by the new one
  const data = JSON.stringify([
    ...freshPatients.filter(p => p.id !== editPatient.id),
    editPatient,
  ]);
  fs.writeFileSync('patients.json', data);

  res.status(200).json(editPatient)
})

app.get('/patients/:patientId', (req, res) => {
  const id = req.params.patientId;
  res.status(200).json(freshPatients.find(pat => pat.id === id));
})

app.get('/patients/by_hin/:patientHin', (req, res) => {
  const hin = req.params.patientHin;
  res.status(200).json(freshPatients.find(pat => pat.hin_number === hin));
})

// Resource routes
app.get('/resources', (req, res) => {
  const perPage = req.query.per_page;
  const page = req.query.page;
  res.header('X-total-count', freshAccounts.length)
  res.status(200).json(pagination([...freshAccounts], +perPage, +page))
})

app.get('/resources/:resourceId', (req, res) => {
  const resourceId = req.params.resourceId;
  res.status(200).json(freshAccounts.find(account => account.id === resourceId));
})

app.get('/resources/:resourceId/availabilities', (req, res) => {
  const resourceId = req.params.resourceId;
  const perPage = req.query.per_page;
  const page = req.query.page;
  const availabilitiesToReturn = freshAvailabilities.filter(a => a.resource.id === resourceId)
  res.header('X-total-count', availabilitiesToReturn.length)
  res.status(200).json(pagination(availabilitiesToReturn, +perPage, +page))
})

app.get('/resources/:resourceId/appointments', (req, res) => {
  const resourceId = req.params.resourceId;
  const perPage = req.query.per_page;
  const page = req.query.page;
  const availability_ids = freshAvailabilities.filter(a => a.resource.id === resourceId).map(a => a.id)
  const appointmentsToReturn = freshAppointments.filter(a => availability_ids.includes(a.availability_id))
  res.header('X-total-count', appointmentsToReturn.length)
  res.status(200).json(pagination(appointmentsToReturn, +perPage, +page))
})

app.get('/resources/:resourceId/services', (req, res) => {
  const resourceId = req.params.resourceId;
  console.log(resourceId)
  res.status(200).json(freshServicesByAccount.hasOwnProperty(resourceId) ? freshServicesByAccount[resourceId] : [])
})

// Service routes
app.get('/services', (req, res) => {
  res.status(200).json(Object.values(freshServicesByAccount))
})

app.get('/services/:serviceId', (req, res) => {
  const serviceId = req.params.serviceId;
  res.status(200).json(Object.values(freshServicesByAccount).find(s => s.id === serviceId))
})


app.get('/services/:serviceId/availabilities', (req, res) => {
  // const serviceId = req.params.serviceId;
  // const perPage = req.query.per_page;
  // const page = req.query.page;
  // const availabilitiesToReturn = freshAvailabilities.filter(a => a.service.id === serviceId)
  // res.header('X-total-count', availabilitiesToReturn.length)
  // res.status(200).json(pagination(availabilitiesToReturn, +perPage, +page))
  res.status(299).json('not useful anymore')
})

app.get('/services/:serviceId/appointments', (req, res) => {
  // const serviceId = req.params.serviceId;
  // const perPage = req.query.per_page;
  // const page = req.query.page;
  // const availability_ids = freshAvailabilities.filter(a => a.service.id === serviceId).map(a => a.id)
  // const appointmentsToReturn = freshAppointments.filter(a => availability_ids.includes(a.availability_id))
  // res.header('X-total-count', appointmentsToReturn.length)
  // res.status(200).json(pagination(appointmentsToReturn, +perPage, +page))
  res.status(299).json('not useful anymore')
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
