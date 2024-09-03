const request = require('request-promise-native');
const { getCodeFromCountryName } = require('./countryCodes');
const CustomError = require('./errors');

const getAlphaNumericString = (str) => str.replace(/\W/g, '');

const getUpcomingHolidays = async (country) => {
  const countryCode = getCodeFromCountryName(country);

  if (!countryCode) {
    throw new CustomError('Invalid country name', 400);
  }

  const result = await request.get(
    `https://date.nager.at/api/v3/NextPublicHolidays/${countryCode}`,
  );

  return JSON.parse(result);
};

const generateHolidayDiscountCode = async (holiday, percent) => {
  if (!holiday || !percent) {
    throw new CustomError('Invalid holiday or percentage', 400);
  }

  const pseudoRandomCode = (Math.random() + 1).toString(36).substring(7);

  // Simulate a delay of 1 s
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return `${getAlphaNumericString(holiday.toUpperCase())}${getAlphaNumericString(percent)}-${pseudoRandomCode}`;
};

module.exports = {
  getUpcomingHolidays,
  generateHolidayDiscountCode,
};
