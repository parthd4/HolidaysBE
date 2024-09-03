const request = require('request-promise-native');
const constants = require('./constants');

const getAccountId = async (token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const result = await request.get(
    `https://api.hubapi${constants.QA ? 'qa' : ''}.com/account-info/v3/details`,
    {
      headers,
    },
  );

  return JSON.parse(result).portalId;
};

const getContactInfo = async ({ headers, contactId }) => {
  const result = await request.get(
    `https://api.hubapi${constants.QA ? 'qa' : ''}.com/crm/v3/objects/contacts/${contactId}`,
    {
      headers,
    },
  );

  return JSON.parse(result).properties;
};

const saveDiscountToContactNote = async ({
  headers,
  code,
  contactId,
  holidayName,
  userName,
}) => {
  const body = {
    properties: {
      hs_timestamp: Date.now(),
      hs_note_body: `${userName} generated this single use discount code for ${holidayName}: ${code}`,
    },
    associations: [
      {
        to: {
          id: contactId,
        },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 202,
          },
        ],
      },
    ],
  };

  const result = await request.post(
    `https://api.hubapi${constants.QA ? 'qa' : ''}.com/crm/v3/objects/notes`,
    {
      headers,
      body: JSON.stringify(body),
    },
  );

  return JSON.parse(result);
};

const sendGreetingCard = async ({
  headers,
  coverText,
  contactId,
  userName,
}) => {
  const body = {
    properties: {
      hs_timestamp: Date.now(),
      hs_postal_mail_body: `${userName} sent a '${coverText}' card`,
    },
    associations: [
      {
        to: {
          id: contactId,
        },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 453,
          },
        ],
      },
    ],
  };

  const result = await request.post(
    `https://api.hubapi${constants.QA ? 'qa' : ''}.com/crm/v3/objects/postal_mail`,
    {
      headers,
      body: JSON.stringify(body),
    },
  );

  return JSON.parse(result);
};

module.exports = {
  getAccountId,
  saveDiscountToContactNote,
  getContactInfo,
  sendGreetingCard,
};
