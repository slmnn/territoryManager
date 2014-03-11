module.exports = {
  sc_salt : process.env.SC_SALT,
  sc_password : process.env.SC_PASSWORD,

  default_territory_holder : 'Aluepöytä',
  default_territory_holder_id : '5310a361156abf701b063329',
  admin_init_password : '2348jhj3hh',

  limit_for_rarely_covered_territory : process.env.LIMIT_RARELY_COVERED, // days
  territory_letters : ['A','H','K','L','M','N','V']
};