const QA = process.env.QA || false;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = process.env.SCOPE;
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth-callback`;

module.exports = {
  QA,
  CLIENT_ID,
  CLIENT_SECRET,
  SCOPE,
  PORT,
  REDIRECT_URI,
};
