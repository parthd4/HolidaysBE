const { Signature } = require('@hubspot/api-client');
const CustomError = require('./errors');

const validateSignature = (req, next) => {
  const url = `${req.protocol}://${req.header('host')}${req.url}`;
  const method = req.method;
  const clientSecret = process.env.CLIENT_SECRET;
  const signatureV3 = req.header('X-HubSpot-Signature-v3');
  const timestamp = req.header('X-HubSpot-Request-Timestamp');

  // Reject the request if the timestamp is older than 5 minutes.
  if (parseInt(timestamp, 10) < Date.now() - 5 * 60 * 1000) {
    throw new CustomError('Bad request.', 401);
  }

  const requestBody =
    req.body === undefined ||
    req.body === null ||
    req.body === '' ||
    method === 'GET'
      ? ''
      : JSON.stringify(req.body);

  console.log({
    signatureVersion: 'v3',
    signature: signatureV3,
    method,
    requestBody,
    url,
    timestamp,
  });

  const validV3 = Signature.isValid({
    signatureVersion: 'v3',
    signature: signatureV3,
    method,
    clientSecret,
    requestBody,
    url,
    timestamp,
  });

  if (!validV3) {
    throw new CustomError('Bad request.', 401);
  }
};

module.exports = {
  validateSignature,
};
