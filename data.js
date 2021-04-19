import faker from "faker";
import moment from "moment";
import fs from "fs";

function createAccount(i) {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = `${firstName}.${lastName}@gmail.com`;

  return {
    first_name: firstName,
    last_name: lastName,
    id: `${i}-${faker.random.uuid()}`,
    license: `lic-${faker.random.number()}`,
    last_revision_datetime: faker.date.recent(),
    locale: "fr_CA",
    email: email.toLowerCase(),
    kind: "doctor",
  };
}

function createService(i) {
  const id = `${i}-${faker.random.uuid()}`;
  const code = faker.vehicle.vehicle();

  return {
    id: id,
    code: code,
    last_revision_datetime: faker.date.recent(),
    description_fr_ca: `fr-${code}`,
    description_en: `en-${code}`,
    message_fr_ca: code,
    message_en: code,
  };
}

function createPatient(i, freshAccounts) {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = `${firstName}.${lastName}@gmail.com`;
  const dateBirth = faker.date.past();
  const gender = Math.floor(Math.random() * 1) + 0;
  const hin =
    `${lastName.substring(0, 3)}${
      firstName[0]
    }${dateBirth.getFullYear().toString().substring(2, 4)}` +
    `${
      gender === 1
        ? parseInt(("0" + (dateBirth.getMonth() + 1)).slice(-2)) + 50
        : ("0" + (dateBirth.getMonth() + 1)).slice(-2)
    }` +
    `${("0" + dateBirth.getDate()).slice(-2)}` +
    `${Math.floor(Math.random() * (99 - 9)) + 10}`;
  const lastRevisionDatetime = faker.date.recent();

  const hinExpirationDate = faker.date.future()
  const monthExpiration = hinExpirationDate.getMonth() + 1 < 10 ? `0${hinExpirationDate.getMonth() + 1}` : hinExpirationDate.getMonth() + 1

  const postalCode = `A${Math.floor(Math.random() * 9) + 0}B${Math.floor(Math.random() * 9) + 0}C${Math.floor(Math.random() * 9) + 0}`

  const data = {
    first_name: firstName,
    last_name: lastName,
    id: `${i}-${faker.random.uuid()}`,
    locale: "fr_CA",
    email: email.toLowerCase(),
    gender,
    hin_number: hin.toUpperCase(),
    hin_expiration_date: `${hinExpirationDate.getFullYear()}/${monthExpiration}`,
    date_of_birth: moment(dateBirth).format('YYYY-MM-DD'),
    last_revision_datetime: lastRevisionDatetime,
    address: {
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      postal_code: postalCode,
      last_revision_datetime: lastRevisionDatetime,
      iso_code: 'CA-QC',
    },
    contact_methods: [
      {
        last_revision_datetime: lastRevisionDatetime,
        number: faker.phone.phoneNumber(),
        kind: "work",
      },
    ],
  };

  // if (i === 0 && i === 1) {
  data["family_doctor"] = freshAccounts[0];
  // }

  return data;
}

function createServicesByAccount() {
  return [...Array(2).keys()].map((i) => createService(i));
}

function createAvailability(i, a, s) {
  const startDate = moment(faker.date.soon());
  const endDate = moment(startDate).add(1, "hours");
  return {
    id: `${i}-${faker.random.uuid()}`,
    start_time: startDate.format(),
    end_time: endDate.format(),
    last_revision_datetime: faker.date.recent(),
    note: "Note",
    appointment_id: null,
    resource: a,
    service: s,
  };
}

function createAppointment(i, a, p) {
  return {
    id: `${i}-${faker.random.uuid()}`,
    availability_id: a.id,
    start_time: a.start_time,
    end_time: a.end_time,
    service_id: a.service.id,
    resource_id: a.resource.id,
    last_revision_datetime: faker.date.recent(),
    created_at: moment().format(),
    patient_id: p.id,
    patient_hin_number: p.hin_number,
    visit_reason: faker.lorem.words(),
    note: faker.lorem.words(),
    cancelled: false,
    cancelled_at: null,
    cancelled_by: null,
  };
}

export function createNewPatient(petal_patient) {
  return {
    id: `new-${faker.random.uuid()}`,
    first_name: petal_patient.first_name,
    last_name: petal_patient.last_name,
    gender: petal_patient.gender,
    email: petal_patient.email,
    hin_number: petal_patient.hin_number,
    hin_expiration_date: petal_patient.hin_expiration_date,
    last_revision_datetime: petal_patient.last_revision_datetime,
    date_of_birth: petal_patient.date_of_birth,
    locale: petal_patient.locale,
    family_doctor: null,
    address: {
      street: petal_patient.address.street,
      last_revision_datetime: petal_patient.last_revision_datetime,
      city: petal_patient.address.city,
      postal_code: petal_patient.address.postal_code,
      iso_code: petal_patient.address.iso_code,
    },
    contact_methods: petal_patient.contact_methods.map((cm) => ({
      number: cm.number,
      kind: cm.kind,
      last_revision_datetime: petal_patient.last_revision_datetime,
    })),
  };
}

export function editNewPatient(petal_patient, currentPatient) {
  return {
    patient_id: petal_patient.patient_id,
    first_name: petal_patient.first_name,
    last_name: petal_patient.last_name,
    gender: petal_patient.gender,
    email: currentPatient.email || petal_patient.email,
    hin_number: petal_patient.hin_number,
    hin_expiration_date: petal_patient.hin_expiration_date,
    last_revision_datetime: currentPatient.last_revision_datetime,
    date_of_birth: petal_patient.date_of_birth,
    locale: petal_patient.locale,
    family_doctor: currentPatient.family_doctor || null,
    address: {
      street: currentPatient.address.street || petal_patient.address.street,
      last_revision_datetime: currentPatient.last_revision_datetime,
      city: currentPatient.address.city || petal_patient.address.city,
      postal_code:
        currentPatient.address.postal_code || petal_patient.address.postal_code,
      iso_code: currentPatient.address.iso_code || petal_patient.address.iso_code,
    },
    contact_methods: (
      currentPatient.contact_methods || petal_patient.contact_methods
    ).map((cm) => ({
      number: cm.number,
      kind: cm.kind,
      last_revision_datetime: currentPatient.last_revision_datetime,
    })),
  };
}

export function createNewAppointment(petal_appointment, patient, availability) {
  return {
    id: `${faker.random.uuid()}`,
    availability_id: availability.id,
    start_time: availability.start_time,
    end_time: availability.end_time,
    service_id: availability.service.id,
    resource_id: availability.resource.id,
    last_revision_datetime: petal_appointment.last_revision_datetime,
    created_at: moment().format(),
    patient_id: patient.id,
    patient_hin_number: patient.hin_number,
    visit_reason: petal_appointment.visit_reason,
    note: "",
    cancelled: false,
    cancelled_at: null,
    cancelled_by: null,
  };
}

export function initializeObjects({
  freshAccounts,
  freshPatients,
  freshServicesByAccount,
  freshAvailabilities,
  freshAppointments,
}) {
  try {
    const accountsRaw = fs.readFileSync("db/accounts.json");
    freshAccounts = JSON.parse(accountsRaw);
  } catch (err) {
    freshAccounts = [...Array(5).keys()].map((i) => createAccount(i));

    const data = JSON.stringify(freshAccounts);
    fs.writeFileSync("db/accounts.json", data);
  }

  try {
    const patientsRaw = fs.readFileSync("db/patients.json");
    freshPatients = JSON.parse(patientsRaw);
  } catch (err) {
    freshPatients = [...Array(52).keys()].map((i) => createPatient(i, freshAccounts));

    const data = JSON.stringify(freshPatients);
    fs.writeFileSync("db/patients.json", data);
  }

  try {
    const accountByServicesRaw = fs.readFileSync("db/account_by_services.json");
    freshServicesByAccount = JSON.parse(accountByServicesRaw);
  } catch (err) {
    freshServicesByAccount = freshAccounts.reduce((prev, a) => {
      prev[a.id] = createServicesByAccount();
      return prev;
    }, {});

    const data = JSON.stringify(freshServicesByAccount);
    fs.writeFileSync("db/account_by_services.json", data);
  }

  try {
    const availabilitiesRaw = fs.readFileSync("db/availabilities.json");
    freshAvailabilities = JSON.parse(availabilitiesRaw);
  } catch (err) {
    freshAvailabilities = [...Array(40).keys()].map((i) => {
      const accountIndex = Math.floor(Math.random() * freshAccounts.length);
      const account = freshAccounts[accountIndex];
      const serviceIndex = Math.floor(
        Math.random() * freshServicesByAccount[account.id].length
      );
      const service = freshServicesByAccount[account.id][serviceIndex];
      return createAvailability(i, account, service);
    });

    const data = JSON.stringify(freshAvailabilities);
    fs.writeFileSync("db/availabilities.json", data);
  }

  try {
    const appointmentsRaw = fs.readFileSync("db/appointments.json");
    freshAppointments = JSON.parse(appointmentsRaw);
  } catch (err) {
    freshAppointments = freshAvailabilities.map((a, i) => {
      if (freshAvailabilities.length - 1 === i) {
        const patientIndex = Math.floor(Math.random() * freshPatients.length);
        const patient = freshPatients[patientIndex];
        return {
          ...createAppointment(i, a, patient),
          cancelled: true,
          cancelled_at: new Date(),
          cancelled_by: 'emr',
        };
      } else {
        const patientIndex = Math.floor(Math.random() * freshPatients.length);
        const patient = freshPatients[patientIndex];
        return createAppointment(i, a, patient);
      }
    });

    const data = JSON.stringify(freshAppointments);
    fs.writeFileSync("db/appointments.json", data);
  }

  return {
    freshAccounts,
    freshPatients,
    freshServicesByAccount,
    freshAvailabilities,
    freshAppointments,
  };
}
