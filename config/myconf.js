module.exports = {
  sc_salt : process.env.SC_SALT,
  sc_password : process.env.SC_PASSWORD,

  default_territory_holder : 'Aluepöytä',
  default_territory_holder_id : '5310a361156abf701b063329',
  admin_init_password : '2348jhj3hh',

  limit_for_rarely_covered_territory : process.env.LIMIT_RARELY_COVERED || 365, // days
  limit_for_email_notification : process.env.LIMIT_EMAIL_NOTIFICATION || 180,
  territory_letters : ['A','E','H','K','L','M','N','S','V','B'],
  territory_types : ['Normal', 'Business', 'Phone'],

  smtp_username : process.env.SMTP_USERNAME,
  smtp_password : process.env.SMTP_PASSWORD,

  notificationEmail_sender_address : 'Tampere-Messukylä seurakunta <tampere.messukyla@gmail.com>',
  notificationEmail_new_territory : {
  	title: 'Olet ottanut uuden alueen _territoryCode',
  	body: 'Hei _holderName, <br> \
<br> \
Olet ottanut uuden alueen: <br>\
<hr> \
<b>_territoryCode</b>\
<pre>_territoryDetails</pre>\
<a href="http://maps.google.com/?q=_territoryLat,_territoryLng">Näytä alue kartalla</a><br>\
<hr>\
<br> \
Jos aluekortti hukkuu, ilmoita asiasta heti aluepalvelijalle. \
<br>\
<br> \
Sinulla on nyt seuraavat alueet: <br>\
_listAllTerritoryCodes\
<br>\
<br>\
Terveisin,<br>\
Tampere-Messukylä, alueveljet'
  },  
  notificationEmail_removed_territory : {
    title: 'Olet luovuttanut pois alueen _territoryCode',
    body: 'Hei _holderName, <br> \
<br> \
Olet luovuttanut pois alueen: <br>\
<hr> \
<b>_territoryCode</b>\
<pre>_territoryDetails</pre>\
<a href="http://maps.google.com/?q=_territoryLat,_territoryLng">Näytä alue kartalla</a><br>\
<hr>\
<br> \
<br> \
Sinulla on nyt seuraavat alueet: <br>\
_listAllTerritoryCodes\
<br>\
<br>\
Terveisin,<br>\
Tampere-Messukylä, alueveljet'
  },

  notificationEmail_notCovered_territory : {
  	title: 'Muistutus alueen _territoryCode käymisestä',
  	body: 'Hei _holderName, <br>\
<br> \
Sinulla on alue, jota ei ole merkitty käydyksi pitkään aikaan. \
Alueen tiedot näkyvät alla. \
<br> \
<hr> \
<b>_territoryCode, merkitty käydyksi _taken</b>\
<pre>_territoryDetails</pre>\
<a href="http://maps.google.com/?q=_territoryLat,_territoryLng">Näytä alue kartalla</a><br>\
<hr>\
<br>\
Ole hyvä ja ota tämän alueen kortti mukaasi seuraavaan kokoukseen. \
Jos olet käynyt alueen, voit pyytää aluepalvelijaa merkitsemään sen käydyksi. \
Muussa tapauksesssa pyydä apua alueesta huolehtimiseen palvelusryhmäsi valvojalta. \
<br>\
<br>\
Jos aluekortti on hukkunut, ilmoita asiasta heti aluepalvelijalle. \
<br>\
<br>\
Sinulla on nyt seuraavat alueet: <br>\
_listAllTerritoryCodes\
<br>\
<br>\
Terveisin,<br>\
Tampere-Messukylä, alueveljet'
  }

};