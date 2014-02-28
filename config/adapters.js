/**
 * Global adapter config
 * 
 * The `adapters` configuration object lets you create different global "saved settings"
 * that you can mix and match in your models.  The `default` option indicates which 
 * "saved setting" should be used if a model doesn't have an adapter specified.
 *
 * Keep in mind that options you define directly in your model definitions
 * will override these settings.
 *
 * For more information on adapter configuration, check out:
 * http://sailsjs.org/#documentation
 */

module.exports.adapters = {

  // If you leave the adapter config unspecified 
  // in a model definition, 'default' will be used.
  'default': 'disk',

  // Persistent adapter for DEVELOPMENT ONLY
  // (data is preserved when the server shuts down)
  disk: {
    module: 'sails-disk'
  },
  mongo: {
    module   : 'sails-mongo',
    url: process.env.DB_URL,
  }
};

module.exports = {
  sc_salt : process.env.SC_SALT,
  sc_password : process.env.SC_PASSWORD,

  default_territory_holder : 'Aluepöytä',
  default_territory_holder_id : 1,
  admin_init_password : '2348jhj3hh',

  territory_letters : ['A','K','L','M'],
};