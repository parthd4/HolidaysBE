require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const constants = require('./constants');
const { exchangeForTokens, getAccessToken } = require('./tokens');
const { validateSignature } = require('./signature');
const {
  getUpcomingHolidays,
  generateHolidayDiscountCode,
} = require('./holidays');
const {
  saveDiscountToContactNote,
  getContactInfo,
  sendGreetingCard,
} = require('./hubspot');

const app = express();

app.enable('trust proxy');
app.use(bodyParser.json({ strict: false }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

if (!constants.CLIENT_ID || !constants.CLIENT_SECRET) {
  throw new Error('Missing CLIENT_ID or CLIENT_SECRET environment variable.');
}

SCOPES = constants.SCOPE.split(/ |, ?|%20/).join(' ');

//================================//
//   Running the OAuth 2.0 Flow   //
//================================//

// Step 1
// Build the authorization URL to redirect a user
// to when they choose to install the app
const authUrl =
  `https://app.hubspot${constants.QA ? 'qa' : ''}.com/oauth/authorize` +
  `?client_id=${encodeURIComponent(constants.CLIENT_ID)}` + // app's client ID
  `&scope=${encodeURIComponent(SCOPES)}` + // scopes being requested by the app
  `&redirect_uri=${encodeURIComponent(constants.REDIRECT_URI)}`; // where to send the user after the consent page

// Redirect the user from the installation page to
// the authorization URL
app.get('/install', (req, res) => {
  console.log('');
  console.log('=== Initiating OAuth 2.0 flow with HubSpot ===');
  console.log('');
  console.log("===> Step 1: Redirecting user to your app's OAuth URL");
  res.redirect(authUrl);
  console.log('===> Step 2: User is being prompted for consent by HubSpot');
});

// Step 2
// The user is prompted to give the app access to the requested
// resources. This is all done by HubSpot, so no work is necessary
// on the app's end

// Step 3
// Receive the authorization code from the OAuth 2.0 Server,
// and process it based on the query parameters that are passed
app.get('/oauth-callback', async (req, res) => {
  console.log('===> Step 3: Handling the request sent by the server');

  // Received a user authorization code, so now combine that with the other
  // required values and exchange both for an access token and a refresh token
  if (req.query.code) {
    console.log('       > Received an authorization token');

    const authCodeProof = {
      grant_type: 'authorization_code',
      client_id: constants.CLIENT_ID,
      client_secret: constants.CLIENT_SECRET,
      redirect_uri: constants.REDIRECT_URI,
      code: req.query.code,
    };

    // Step 4
    // Exchange the authorization code for an access token and refresh token
    console.log(
      '===> Step 4: Exchanging authorization code for an access token and refresh token',
    );
    const token = await exchangeForTokens(undefined, authCodeProof);
    if (token.message) {
      return res.redirect(`/error?msg=${token.message}`);
    }

    // Once the tokens have been retrieved, use them to make a query
    // to the HubSpot API
    res.redirect(`/successfulInstall`);
  }
});

app.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(`<h2>HubSpot OAuth 2.0 Quickstart App</h2>`);
  res.write(`<a href="/install"><h3>Install the app</h3></a>`);
  res.end();
});

app.get('/error', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(`<h4>Error: ${req.query.msg}</h4>`);
  res.end();
});

app.get('/successfulInstall', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(
    `<h2>The Holidays app has successfully been installed on your HubSpot account</h2>`,
  );
  res.write(
    `<p>Now you can add a Holidays CRM card to your contacts to see upcoming holidays, generate holiday discount codes, and send greeting cards.</p>`,
  );
  res.write(
    `<p>To set up your card, add the Holidays app card to your Contact record middle column</p>`,
  );
  res.write(
    `<a href="https://knowledge.hubspot.com/object-settings/customize-records"><p>Learn more</p></a>`,
  );
  res.end();
});

app.get('/:country/upcomingHolidays', async (req, res, next) => {
  try {
    validateSignature(req);
    const country = decodeURIComponent(req.params.country);
    const result = await getUpcomingHolidays(country);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/generateDiscountCode', async (req, res, next) => {
  try {
    validateSignature(req);
    const { holiday, percentage } = req.body;
    const code = await generateHolidayDiscountCode(holiday, percentage);
    res.json({ code });
  } catch (error) {
    next(error);
  }
});

app.post('/saveDiscountAsContactNote', async (req, res, next) => {
  try {
    validateSignature(req);
    const { code, contactId, holidayName, userName } = req.body;
    const { portalId } = req.query;

    const token = await getAccessToken(portalId);

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      traceparent: req.headers.traceparent,
    };

    await saveDiscountToContactNote({
      headers,
      code,
      contactId,
      holidayName,
      userName,
    });

    res.json({ status: 'success', message: 'Saved note' });
  } catch (error) {
    next(error);
  }
});

app.get('/contactName/:id', async (req, res, next) => {
  try {
    validateSignature(req);
    const contactId = req.params.id;
    const { portalId } = req.query;

    const token = await getAccessToken(portalId);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      traceparent: req.headers.traceparent,
    };
    const { firstname, lastname } = await getContactInfo({
      contactId,
      headers,
    });
    res.json({ firstname, lastname });
  } catch (error) {
    next(error);
  }
});

app.post('/saveGreetingCard', async (req, res, next) => {
  try {
    validateSignature(req);
    const { coverText, message, contactId, userName } = req.body;
    const { portalId } = req.query;

    const token = await getAccessToken(portalId);

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      traceparent: req.headers.traceparent,
    };

    await sendGreetingCard({
      headers,
      coverText,
      message,
      contactId,
      userName,
    });

    res.json({ status: 'success', message: 'Sent mail' });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);

  const defaultErrorMessage =
    'Something went wrong. Try again or contact the app developer.';
  const statusCode = err.statusCode || 500;

  return res
    .status(err.statusCode || 500)
    .send({ error: err.message || defaultErrorMessage, statusCode });
});

app.listen(constants.PORT, () => console.log(`=== Starting your app ===`));
