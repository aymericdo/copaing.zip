import express from "express";
import fs from "fs";
import moment from "moment";
import faker from "faker";
import axios from "axios";
import dotenv from 'dotenv';
import { createHmac, createHash } from 'crypto';
import {
  initializeObjects,
  createNewAppointment,
  createNewPatient,
  editNewPatient,
} from "./data.js";
const app = express();
const router = express.Router();
dotenv.config();

const port = 3008;
app.use(express.json());

const URL = "/apitest/appointmenthub/Medesync/test9.89.1140"

let db = {
  freshAccounts: [],
  freshPatients: [],
  freshServicesByAccount: [],
  freshAvailabilities: [],
  freshAppointments: [],
};

db = initializeObjects(db);
let {
  freshAccounts,
  freshPatients,
  freshServicesByAccount,
  freshAvailabilities,
  freshAppointments,
} = db;

function pagination(arr, perPage, page) {
  if (!arr.length) {
    return [];
  }

  if (!perPage) {
    perPage = 50;
  }
  if (!page) {
    page = 1;
  }

  let chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += perPage)));
  }
  return chunks[page - 1];
}

router.use((req, res, next) => {
  console.log(`${moment()} ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
router.post("/authorization", (req, res) => {
  res.status(200).json({ access_token: "azerty", expires_in: 900000 });
});

// Appointment routes
router.post("/appointments", (req, res) => {
  const appointment = req.body;

  if (
    appointment &&
    Object.keys(appointment).length === 0 &&
    appointment.constructor === Object
  ) {
    res.status(400).send({
      error: {
        msg: "Bad request yo",
        code: "400 error",
      },
    });
    return;
  }

  const patient = freshPatients.find((p) => p.id === appointment.patient_id);
  const availability = freshAvailabilities.find(
    (a) => a.id === appointment.availability_id
  );

  const appointmentAlreadyTaken = freshAppointments.find((a) => {
    return (
      a.patient_id === appointment.patient_id &&
      a.availability_id === appointment.availability_id
    );
  });

  if (appointmentAlreadyTaken) {
    res.status(422).send({
      error: {
        msg: "Unprocessable",
        code: "422 error",
      },
    });
  } else {
    if (!availability || !patient) {
      res.status(404).send({
        error: {
          msg: "No result found",
          code: "404 error",
        },
      });
    } else {
      const newAppointment = createNewAppointment(
        appointment,
        patient,
        availability
      );
      freshAppointments.push(newAppointment);

      fs.writeFileSync(
        "db/appointments.json",
        JSON.stringify(freshAppointments)
      );

      res.status(201).json(newAppointment);
    }
  }
});

router.delete("/appointments/:appointmentId", (req, res) => {
  const appointmentId = req.params.appointmentId;
  const lastRevisionDatetime = req.query.last_revision_datetime;

  let cancelAppointment = freshAppointments.find((a) => a.id === appointmentId);

  if (cancelAppointment) {
    if (cancelAppointment.cancelled) {
      res.status(422).send({
        error: {
          msg: "Unprocessable",
          code: "422 error",
        },
      });
    } else {
      cancelAppointment = {
        ...cancelAppointment,
        cancelled: true,
        cancelled_at: lastRevisionDatetime,
        cancelled_by: "hub",
      };

      // replace the edited patient by the new one
      freshAppointments = [
        ...freshAppointments.filter((a) => a.id !== appointmentId),
        cancelAppointment,
      ];
      fs.writeFileSync(
        "db/appointments.json",
        JSON.stringify(freshAppointments)
      );

      res.status(204).send();
    }
  } else {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
  }
});

router.get("/appointments/:appointmentId", (req, res) => {
  const appointmentId = req.params.appointmentId;
  const appointment = freshAppointments.find((a) => a.id === appointmentId);
  if (appointment) {
    delete appointment.created_at
    res.status(200).json(appointment);
  } else {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
  }
});

// Availability routes
router.get("/availabilities", (req, res) => {
  // const perPage = req.query.per_page;
  // const page = req.query.page;
  // const availabilitiesToReturn = freshAvailabilities
  // res.header('X-total-count', availabilitiesToReturn.length)
  // res.status(200).json(pagination(freshAvailabilities, +perPage, +page))
  res.status(299).json("not useful anymore");
});

router.get("/availabilities/:availabilityId", (req, res) => {
  const availabilityId = req.params.availabilityId;

  const a = freshAvailabilities.find((a) => a.id === availabilityId);
  if (a) {
    const availability = {
      ...a,
      resource_id: a.resource.id,
      service_id: a.service.id,
    }

    delete availability.resource
    delete availability.service

    res.status(200).json(availability);
  } else {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
  }
});

// Patient routes
router.post("/patients", (req, res) => {
  const patient = req.body;

  if (
    patient &&
    Object.keys(patient).length === 0 &&
    patient.constructor === Object
  ) {
    res.status(400).send({
      error: {
        msg: "Bad request yo",
        code: "400 error",
      },
    });
    return;
  }

  const patientAlreadyTaken = freshPatients.find((p) => {
    return p.hin_number === patient.hin_number;
  });

  if (patientAlreadyTaken) {
    res.status(422).send({
      error: {
        msg: "Unprocessable",
        code: "422 error",
      },
    });
    return;
  }

  const newPatient = createNewPatient(patient);
  freshPatients.push(newPatient);

  fs.writeFileSync("db/patients.json", JSON.stringify(freshPatients));

  res.status(201).json(newPatient);
});

router.get("/patients", (req, res) => {
  // const perPage = req.query.per_page;
  // const page = req.query.page;
  // res.header('X-total-count', freshPatients.length)
  // res.status(200).json(pagination([...freshPatients], +perPage, +page))
  res.status(299).json("not useful anymore");
});

router.patch("/patients/:patientId", (req, res) => {
  const patientId = req.params.patientId;
  const newPatient = req.body;

  if (
    newPatient &&
    Object.keys(newPatient).length === 0 &&
    newPatient.constructor === Object
  ) {
    res.status(400).send({
      error: {
        msg: "Bad request yo",
        code: "400 error",
      },
    });
    return;
  }

  let editPatient = freshPatients.find((p) => p.id === patientId);

  if (editPatient) {
    editPatient = editNewPatient(editPatient, newPatient);

    // replace the edited patient by the new one
    freshPatients = [
      ...freshPatients.filter((p) => p.id !== editPatient.id),
      editPatient,
    ];
    fs.writeFileSync("db/patients.json", JSON.stringify(freshPatients));

    res.status(204).send();
  } else {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
  }
});

router.get("/patients/:patientId", (req, res) => {
  const id = req.params.patientId;
  const patient = freshPatients.find((pat) => pat.id === id);
  if (patient) {
    res.status(200).json({
      ...patient,
      contact_methods: patient.contact_methods.map(cm => ({ ...cm, number: cm.number.replace(/\D/g, "").slice(0, 12) }))
    });
  } else {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
  }
});

router.post("/patients/by_hin", (req, res) => {
  const hin = req.body.patient_hin;

  const patient = freshPatients.find((pat) => pat.hin_number === hin);
  if (patient) {
    res.status(200).json({
      ...patient,
      contact_methods: patient.contact_methods.map(cm => ({ ...cm, number: cm.number.replace(/\D/g, "").slice(0, 12) }))
    });
  } else {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
  }
});

// Resource routes
router.get("/resources", (req, res) => {
  const perPage = req.query.per_page;
  const page = req.query.page;

  res.header("X-total-count", freshAccounts.length);
  res.status(200).json(pagination([...freshAccounts], +perPage, +page));
});

router.get("/resources/:resourceId", (req, res) => {
  const resourceId = req.params.resourceId;

  const account = freshAccounts.find((account) => account.id === resourceId);
  if (account) {
    res.status(200).json(account);
  } else {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
  }
});

router.get("/resources/:resourceId/availabilities", (req, res) => {
  const resourceId = req.params.resourceId;
  const perPage = req.query.per_page;
  const page = req.query.page;

  const account = freshAccounts.find((account) => account.id === resourceId);

  if (!account) {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
    return;
  }

  const startTime = req.query.start_time;
  const endTime = req.query.end_time;

  if (!startTime || !endTime) {
    res.status(400).send({
      error: {
        msg: "Bad request yo",
        code: "400 error",
      },
    });
    return;
  }

  const availabilitiesToReturn = freshAvailabilities
    .filter(
      (a) =>
        a.resource.id === resourceId &&
        moment(startTime, moment.ISO_8601).isBefore(
          moment(a.start_time),
          moment.ISO_8601
        ) &&
        moment(endTime, moment.ISO_8601).isAfter(
          moment(a.end_time),
          moment.ISO_8601
        )
    )
    .map((a) => {
      const availability = {
        ...a,
        resource_id: a.resource.id,
        service_id: a.service.id,
      }

      delete availability.resource
      delete availability.service

      return availability
    });

  res.header("X-total-count", availabilitiesToReturn.length);
  res.status(200).json(pagination(availabilitiesToReturn, +perPage, +page));
});

router.get("/resources/:resourceId/appointments", (req, res) => {
  const resourceId = req.params.resourceId;
  const perPage = req.query.per_page;
  const page = req.query.page;

  const account = freshAccounts.find((account) => account.id === resourceId);
  if (!account) {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
    return;
  }

  const startTime = req.query.start_time;
  const endTime = req.query.end_time;

  if (!startTime || !endTime) {
    res.status(400).send({
      error: {
        msg: "Bad request yo",
        code: "400 error",
      },
    });
    return;
  }

  const availability_ids = freshAvailabilities
    .filter((a) => a.resource.id === resourceId)
    .map((a) => a.id);

  const appointmentsToReturn = freshAppointments.filter(
    (a) =>
      availability_ids.includes(a.availability_id) &&
      moment(startTime, moment.ISO_8601).isBefore(
        moment(a.start_time),
        moment.ISO_8601
      ) &&
      moment(endTime, moment.ISO_8601).isAfter(
        moment(a.end_time),
        moment.ISO_8601
      )
  ).map((a) => {
    delete a.created_at
    return a
  });

  res.header("X-total-count", appointmentsToReturn.length);
  res.status(200).json(pagination(appointmentsToReturn, +perPage, +page));
});

router.get("/resources/:resourceId/services", (req, res) => {
  const resourceId = req.params.resourceId;
  const perPage = req.query.per_page;
  const page = req.query.page;

  const account = freshAccounts.find((account) => account.id === resourceId);
  if (!account) {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
    return;
  }

  if (!freshServicesByAccount[resourceId]) {
    res.header("X-total-count", 0);
    res.status(200).json([])
    return;
  }

  res.header("X-total-count", freshServicesByAccount[resourceId].length);
  res
    .status(200)
    .json(
      freshServicesByAccount.hasOwnProperty(resourceId)
        ? pagination(freshServicesByAccount[resourceId], +perPage, +page)
        : []
    );
});

// Service routes
router.get("/services", (req, res) => {
  const perPage = req.query.per_page;
  const page = req.query.page;

  res
    .status(200)
    .json(
      pagination(Object.values(freshServicesByAccount).flat(), +perPage, +page)
    );
});

router.get("/services/:serviceId", (req, res) => {
  const serviceId = req.params.serviceId;
  const service = Object.values(freshServicesByAccount)
    .flat()
    .find((s) => s.id === serviceId);

  if (!service) {
    res.status(404).send({
      error: {
        msg: "No result found",
        code: "404 error",
      },
    });
    return;
  }

  res.status(200).json(service);
});

router.get("/services/:serviceId/availabilities", (req, res) => {
  // const serviceId = req.params.serviceId;
  // const perPage = req.query.per_page;
  // const page = req.query.page;
  // const availabilitiesToReturn = freshAvailabilities.filter(a => a.service.id === serviceId)
  // res.header('X-total-count', availabilitiesToReturn.length)
  // res.status(200).json(pagination(availabilitiesToReturn, +perPage, +page))
  res.status(299).json("not useful anymore");
});

router.get("/services/:serviceId/appointments", (req, res) => {
  // const serviceId = req.params.serviceId;
  // const perPage = req.query.per_page;
  // const page = req.query.page;
  // const availability_ids = freshAvailabilities.filter(a => a.service.id === serviceId).map(a => a.id)
  // const appointmentsToReturn = freshAppointments.filter(a => availability_ids.includes(a.availability_id))
  // res.header('X-total-count', appointmentsToReturn.length)
  // res.status(200).json(pagination(appointmentsToReturn, +perPage, +page))
  res.status(299).json("not useful anymore");
});

app.use(URL, router);

app.post('/webhook_partner', (req, res) => {
  const keyID = "a9b85d2e-6049-4558-9d36-447f3f7710b8"
  const secret = "51bcabef6ad7f9d117dabaf21969ab42446286a4fa30dc204bd4f27ff9f43f85"

  const authorization = req.get('authorization')
  const authorizationArray = authorization.split(' ')

  const parsed_parts = ['keyId', 'algorithm', 'headers', 'timestamps', 'nonce', 'signature'].reduce((prev, key) => {
    const header_key = `${key}=`
    const item = authorizationArray.find(elem => elem.startsWith(header_key))
    const value = item.replace(header_key, "")

    prev[key] = value

    return prev;
  }, {})

  const method = 'POST';
  const host = req.get('host')
  const path = '/webhook_partner'
  const queryString = ''

  let signingString = [method, host, path, queryString].join('\n') + '\n';

  const headersHeader = req.headers

  let headersHeaderStr = ''
  parsed_parts['headers'].split(',').forEach((key) => {
    headersHeaderStr += `${key.toLowerCase()}:${headersHeader[key]}\n`
  })

  const headerSignature = createHash('sha256')
    .update(JSON.stringify(headersHeaderStr).slice(1, -1))
    .digest('base64')

  signingString += headerSignature + '\n';

  const bodySignature = createHash('sha256')
    .update(JSON.stringify(req.body))
    .digest('base64')

  signingString += bodySignature + '\n';
  
  signingString += '\n'
  signingString += keyID + '\n';
  signingString += +parsed_parts['timestamps'] + '\n';
  signingString += parsed_parts['nonce']

  const signature =
    createHmac('sha256', secret)
      .update(JSON.stringify(signingString).slice(1, -1))
      .digest('base64')

  console.log('signature')

  console.log(parsed_parts['signature'])
  console.log(signature)
  console.log(parsed_parts['signature'] === signature)

  res.status(204).send();
})

app.post("/webhook", (req, res) => {
  const type = req.body.type
  const action = req.body.action
  const webhook = { type, action }
  console.log(webhook);
  /*
    webhook object :
    {
      type: 'availabilities'|'appointments'|'resources'|'patients'|'services',
      action: 'delete'|'create'|'update',
    }

    ex: curl -H "Content-Type: application/json" -X POST -d '{"type":"availabilities", "action":"create"}' http://localhost:3008/webhook
  */

  const keyID = '23953650-b00f-11eb-8529-0242ac130003'

  const data = {
    request_action: webhook.action,
    group_id: 'test9.89.1140',
  }

  if (type === "availabilities") {
    if (action === "create") {
      const availability = {
        ...freshAvailabilities[0],
        resource_id: freshAvailabilities[0].resource.id,
        service_id: freshAvailabilities[0].service.id,
      }

      delete availability.resource
      delete availability.service

      data['data'] = availability
    } else if (action === 'update') {
      const availability = {
        ...freshAvailabilities[0],
        resource_id: freshAvailabilities[0].resource.id,
        service_id: freshAvailabilities[0].service.id,
        note: 'hahaahmdrlol'
      }

      delete availability.resource
      delete availability.service

      data['data'] = availability
    } else if (action === 'delete') {
      const availability = {
        ...freshAvailabilities[0],
        resource_id: freshAvailabilities[0].resource.id,
        service_id: freshAvailabilities[0].service.id,
      }

      delete availability.resource
      delete availability.service

      data['data'] = availability
    }
  } else if (type === "appointments") {
    if (action === "create") {
      const appointment = {
        ...freshAppointments[0],
      }

      delete appointment.created_at

      data['data'] = appointment
    } else if (action === "update") {
      const appointment = {
        ...freshAppointments[0],
        start_time: "2021-05-15T15:57:57+02:00",
        end_time: "2021-05-15T16:57:57+02:00",
        note: 'zbrrah' // never updated
      }

      delete appointment.created_at

      data['data'] = appointment
    } else if (action === 'delete') {
      const appointment = {
        ...freshAppointments[0],
      }

      delete appointment.created_at

      data['data'] = appointment
    }
  } else if (type === "resources") {
    if (action === "create") {
      data['data'] = freshAccounts[0]
    } else if (action === "update") {
      data['data'] = {
        ...freshAccounts[0],
        first_name: 'Marcel',
        last_name: 'Trougnard',
        locale: 'en',
      }
    } else if (action === "delete") {
      data['data'] = freshAccounts[0]
    }
  } else if (type === "patients") {
    const patient = {
      ...freshPatients[0],
      contact_methods: [{
        number: '5555555',
        kind: 'mobile',
        last_revision_datetime: freshPatients[0].last_revision_datetime
      }]
    }

    if (action === "create") {
      data['data'] = patient
    } else if (action === "update") {
      data['data'] = {
        ...patient,
        address: {
          street: '1017 Petal Street',
          city: 'Mourreal',
          postal_code: 'G1F6B9',
          last_revision_datetime: freshPatients[0].last_revision_datetime,
          iso_code: 'CA-QC'
        },
        family_doctor: freshAccounts[1],
        first_name: 'Gerard',
        last_name: 'Bruh',
        hin_number: 'BRUG94101718',
        hin_expiration_date: '1994/10',
        locale: 'en',
        contact_methods: [{
          number: '4444444',
          kind: 'home',
          last_revision_datetime: freshPatients[0].last_revision_datetime
        }]
      }
    } else if (action === "delete") {
      data['data'] = patient
    }
  } else if (type === "services") {
    if (action === "create") {
      data['data'] = {
        ...freshServicesByAccount[freshAccounts[0].id][0],
        resource_id: freshAccounts[0].id
      }
    } else if (action === "update") {
      data['data'] = {
        ...freshServicesByAccount[freshAccounts[0].id][0],
        resource_id: freshAccounts[0].id,
        code: 'BRUH',
        description_fr_ca: 'une description de service merveilleuse',
        description_en: 'a wonderful service description',
      }
    } else if (action === "delete") {
      data['data'] = {
        ...freshServicesByAccount[freshAccounts[0].id][0],
        resource_id: freshAccounts[0].id
      }
    }
  }

  const headers = ['Content-Type', 'Host'];

  const timestamps = ~~(Date.now() / 1000);

  const nonce = faker.datatype.uuid();

  const method = 'POST';
  const host = `localhost:3000`;
  const path = `/webhooks/${type}`
  const queryString = ''

  let signingString = [method, host, path, queryString].join('\n') + '\n';

  let headersStringToHash = 'content-type:application/json'
  headersStringToHash += '\n' + 'host:' + host + '\n'

  const headerSignature = createHash('sha256')
    .update(headersStringToHash)
    .digest('base64')

  signingString += headerSignature + '\n';
  
  let finalHeaders = {
    "Content-Type": "application/json"
  }
  const bodySignature = createHash('sha256')
    .update(JSON.stringify(data))
    .digest('base64')

  signingString += bodySignature + '\n';
  
  signingString += '\n'
  signingString += keyID + '\n';
  signingString += timestamps + '\n';
  signingString += nonce

  const signature =
    createHmac('sha256', process.env.WEBHOOKS_SECRET)
      .update(signingString)
      .digest('base64')

  const authorizationHeaderValue = 'Signature' +
    ' keyId=' + keyID +
    ' algorithm=hmac-sha256' +
    ' headers=' + headers.map(header => header.toLocaleLowerCase()).join(',') +
    ' nonce=' + nonce +
    ' timestamps=' + timestamps +
    ' signature=' + signature

  finalHeaders['Authorization'] = authorizationHeaderValue

  axios.post(`http://localhost:3000/webhooks/${type}`, data, { headers: finalHeaders })
    .then((response) => {
      console.log('ok')
      // console.log(response);
    })
    .catch((error) => {
      console.log(error);
    });

  res.status(201).send();
})

// console.log("CERTIFICATION VARIABLES");
// console.log(`baseUrl: http://localhost:${port}${URL}`);
// console.log(`to_delete_appointment_id: ${freshAppointments[0].id}`);
// console.log(`to_get_appointment_id: ${freshAppointments[1].id}`);
// console.log(`to_get_availability_id: ${freshAvailabilities[0].id}`);
// console.log(`to_patch_patient_id: ${freshPatients[0].id}`);
// console.log(`to_get_patient_id: ${freshPatients[0].id}`);
// console.log(`to_get_patient_hin: ${freshPatients[0].hin_number}`);
// console.log(`to_get_resource_id: ${freshAccounts[0].id}`);
// console.log(
//   `to_get_service_id: ${freshServicesByAccount[freshAccounts[0].id][0].id}`
// );
// console.log(
//   `cancelled_appointment_id_by_emr: ${
//     freshAppointments[freshAppointments.length - 1].id
//   }`
// );

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
