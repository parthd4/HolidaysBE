const db = require('./queries');
const constants = require('./constants');
const request = require('request-promise-native');
const { getAccountId } = require('./hubspot');

const exchangeForTokens = async (_portalId, exchangeProof) => {
  try {
    const responseBody = await request.post(
      `https://api.hubapi${constants.QA ? 'qa' : ''}.com/oauth/v1/token`,
      {
        form: exchangeProof,
      },
    );

    const tokens = JSON.parse(responseBody);

    // Get portal ID to store tokens in db
    const portalId = _portalId || (await getAccountId(tokens.access_token));

    db.addOrUpdateUser(
      portalId,
      tokens.access_token,
      tokens.refresh_token,
      Date.now() + tokens.expires_in * 1000 * 0.9,
    );

    console.log('       > Received an access token and refresh token');
    return tokens.access_token;
  } catch (e) {
    console.error(
      `       > Error exchanging ${exchangeProof.grant_type} for access token`,
    );
    return JSON.parse(e.response.body);
  }
};

const refreshAccessToken = async (portalId, refresh_token) => {
  const refreshTokenProof = {
    grant_type: 'refresh_token',
    client_id: constants.CLIENT_ID,
    client_secret: constants.CLIENT_SECRET,
    redirect_uri: constants.REDIRECT_URI,
    refresh_token,
  };
  return await exchangeForTokens(portalId, refreshTokenProof);
};

const getAccessToken = async (portalId) => {
  // get user from db
  const user = await db.getUser(portalId);

  const now = Date.now();

  if (user.expires < now) {
    console.log('Access token has expired, fetching a new one');
    return await refreshAccessToken(portalId, user.refresh_token);
  }
  return user.access_token;
};

module.exports = {
  exchangeForTokens,
  getAccessToken,
};
