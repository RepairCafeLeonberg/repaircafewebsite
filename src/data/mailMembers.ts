export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  isMember: boolean;
  tags: string[];
  greeting: string;
  closing: string;
  personalNote?: string;
};

export const members: Member[] = [
  {
    id: 'michael-augustin',
    firstName: 'Michael',
    lastName: 'Augustin',
    email: 'miau57@yahoo.de',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Michael',
    closing: 'Viele Grüße'
  },
  {
    id: 'robin-baur',
    firstName: 'Robin',
    lastName: 'Baur',
    email: 'robin-b@gmx.de',
    isMember: true,
    tags: ['PC'],
    greeting: 'Lieber Robin',
    closing: 'Viele Grüße'
  },
  {
    id: 'lothar-bogsch',
    firstName: 'Lothar',
    lastName: 'Bogsch',
    email: 'l.bogsch@gmx.de',
    isMember: true,
    tags: ['PC'],
    greeting: 'Lieber Lothar',
    closing: 'Viele Grüße'
  },
  {
    id: 'elmar-bolay',
    firstName: 'Elmar',
    lastName: 'Bolay',
    email: 'elmar@bolay.de',
    isMember: true,
    tags: ['Fahrrad', 'Elektro', 'Holz'],
    greeting: 'Lieber Elmar',
    closing: 'Viele Grüße'
  },
  {
    id: 'dirk-maria-coolens',
    firstName: 'Dirk Maria',
    lastName: 'Coolens',
    email: 'info.coolens@web.de',
    isMember: true,
    tags: ['Elektro', 'Holz'],
    greeting: 'Lieber Dirk',
    closing: 'Viele Grüße'
  },
  {
    id: 'roxane-debruyker',
    firstName: 'Roxane',
    lastName: 'Debruyker',
    email: 'roxane.debruyker@gmail.com',
    isMember: true,
    tags: ['Fahrrad'],
    greeting: 'Liebe Roxane',
    closing: 'Viele Grüße'
  },
  {
    id: 'thorsten-dechert',
    firstName: 'Thorsten',
    lastName: 'Dechert',
    email: 'thorsten.Dechert@web.de',
    isMember: true,
    tags: ['Elektro', 'Holz'],
    greeting: 'Lieber Thorsten',
    closing: 'Viele Grüße'
  },
  {
    id: 'bodo-friedrich',
    firstName: 'Bodo',
    lastName: 'Friedrich',
    email: 'friedrich.bodo@t-online.de',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Bodo',
    closing: 'Viele Grüße'
  },
  {
    id: 'waltraud-gellert',
    firstName: 'Waltraud',
    lastName: 'Gellert',
    email: 'gellert54@t-online.de',
    isMember: true,
    tags: ['Textil'],
    greeting: 'Liebe Waltraud',
    closing: 'Viele Grüße'
  },
  {
    id: 'margret-haessler',
    firstName: 'Margret',
    lastName: 'Haeßler',
    email: 'majohaessler@gmail.com',
    isMember: true,
    tags: ['Café', 'Empfang', 'Textil'],
    greeting: 'Liebe Margret',
    closing: 'Viele Grüße'
  },
  {
    id: 'sieghard-hahm',
    firstName: 'Sieghard',
    lastName: 'Hahm',
    email: 'S.Hahm@t-online.de',
    isMember: true,
    tags: ['Fahrrad'],
    greeting: 'Lieber Sieghard',
    closing: 'Viele Grüße'
  },
  {
    id: 'margot-haebe',
    firstName: 'Margot',
    lastName: 'Häbe',
    email: 'm.haebe@pelliccia.de',
    isMember: true,
    tags: ['Café', 'Empfang'],
    greeting: 'Liebe Margot',
    closing: 'Viele Grüße'
  },
  {
    id: 'alexander-just',
    firstName: 'Alexander',
    lastName: 'Just',
    email: 'alexjust93@yahoo.de',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Alexander',
    closing: 'Viele Grüße'
  },
  {
    id: 'hagen-klenk',
    firstName: 'Hagen',
    lastName: 'Klenk',
    email: 'h1604@web.de',
    isMember: true,
    tags: ['PC', 'Elektro'],
    greeting: 'Lieber Hagen',
    closing: 'Viele Grüße'
  },
  {
    id: 'monique-klumpp',
    firstName: 'Monique',
    lastName: 'Klumpp',
    email: 'Mon.Klumpp@gmx.de',
    isMember: true,
    tags: ['Café', 'Empfang', 'Textil'],
    greeting: 'Liebe Monique',
    closing: 'Viele Grüße'
  },
  {
    id: 'roswitha-kohlhaas-krebs',
    firstName: 'Roswitha',
    lastName: 'Kohlhaas-Krebs',
    email: 'repair@onlinekrebs.de',
    isMember: true,
    tags: ['Café', 'Empfang'],
    greeting: 'Liebe Roswitha',
    closing: 'Viele Grüße'
  },
  {
    id: 'roland-luetze',
    firstName: 'Roland',
    lastName: 'Lütze',
    email: 'Roland.luetze@arcor.de',
    isMember: true,
    tags: ['Elektro', 'Holz'],
    greeting: 'Lieber Roland',
    closing: 'Viele Grüße'
  },
  {
    id: 'eckart-matthias',
    firstName: 'Eckart',
    lastName: 'Matthias',
    email: 'info@ematthias.de',
    isMember: true,
    tags: ['webmaster'],
    greeting: 'Lieber Eckart',
    closing: 'Viele Grüße'
  },
  {
    id: 'eckart-matthias-webmaster',
    firstName: 'Eckart',
    lastName: 'Matthias (webmaster)',
    email: 'info@repair-leonberg.de',
    isMember: true,
    tags: [],
    greeting: 'Lieber Eckart',
    closing: 'Viele Grüße'
  },
  {
    id: 'helga-mueller',
    firstName: 'Helga',
    lastName: 'Müller',
    email: 'helga.mueller100@gmx.de',
    isMember: true,
    tags: ['Café', 'Empfang'],
    greeting: 'Liebe Helga',
    closing: 'Viele Grüße'
  },
  {
    id: 'lucie-neumann',
    firstName: 'Lucie',
    lastName: 'Neumann',
    email: 'neumann@corporate-profiler.de',
    isMember: true,
    tags: ['Café', 'Empfang', 'Elektro'],
    greeting: 'Liebe Lucie',
    closing: 'Mit freundlichen Grüßen'
  },
  {
    id: 'harumi-poetke',
    firstName: 'Harumi',
    lastName: 'Pötke',
    email: undefined,
    isMember: true,
    tags: [],
    greeting: 'Liebe Harumi',
    closing: 'Viele Grüße'
  },
  {
    id: 'mario-roth',
    firstName: 'Mario',
    lastName: 'Roth',
    email: 'marioroth@gmx.de',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Mario',
    closing: 'Viele Grüße'
  },
  {
    id: 'bernhard-schmidt',
    firstName: 'Bernhard',
    lastName: 'Schmidt',
    email: 'schmidt-bernhard@web.de',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Bernhard',
    closing: 'Mit freundlichen Grüßen'
  },
  {
    id: 'reiner-schmidt',
    firstName: 'Reiner',
    lastName: 'Schmidt',
    email: 'reiner.schmidt2000@gmx.de',
    isMember: true,
    tags: ['Fahrrad'],
    greeting: 'Lieber Rainer',
    closing: 'Viele Grüße'
  },
  {
    id: 'peter-schueller',
    firstName: 'Peter',
    lastName: 'Schüller',
    email: 'peter-schueller@web.de',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Peter',
    closing: 'Viele Grüße'
  },
  {
    id: 'stefan-sittel',
    firstName: 'Stefan',
    lastName: 'Sittel',
    email: 'SRSittel@aol.com',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Stefan',
    closing: 'Viele Grüße'
  },
  {
    id: 'klaus-staudt',
    firstName: 'Klaus',
    lastName: 'Staudt',
    email: 'staudt.klaus@gmail.com',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Klaus',
    closing: 'Viele Grüße'
  },
  {
    id: 'guenter-stiefel',
    firstName: 'Günter',
    lastName: 'Stiefel',
    email: 'gst56@yahoo.de',
    isMember: true,
    tags: ['Fahrrad'],
    greeting: 'Lieber Günter',
    closing: 'Viele Grüße'
  },
  {
    id: 'werner-stocker',
    firstName: 'Werner',
    lastName: 'Stocker',
    email: 'westocker@online.de',
    isMember: true,
    tags: ['Leitung', 'Fahrrad'],
    greeting: 'Lieber Werner',
    closing: 'Mit freundlichen Grüßen'
  },
  {
    id: 'renate-strauss',
    firstName: 'Renate',
    lastName: 'Strauss',
    email: 'rs.vs@kabelbw.de',
    isMember: true,
    tags: ['Leitung', 'Café', 'Empfang'],
    greeting: 'Liebe Renate',
    closing: 'Viele Grüße'
  },
  {
    id: 'tilmann-stoehr',
    firstName: 'Tilmann',
    lastName: 'Stöhr',
    email: 't.stoehr@gmx.net',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Tilmann',
    closing: 'Viele Grüße'
  },
  {
    id: 'johannes-thieme',
    firstName: 'Johannes',
    lastName: 'Thieme',
    email: 'johannes.thieme@posteo.de',
    isMember: true,
    tags: ['Elektro', 'Sonstiges'],
    greeting: 'Lieber Johannes',
    closing: 'Viele Grüße'
  },
  {
    id: 'karl-heinz-wagner',
    firstName: 'Karl-Heinz',
    lastName: 'Wagner',
    email: 'k-h.wagner@t-online.de',
    isMember: true,
    tags: ['Computer', 'Elektro'],
    greeting: 'Lieber Karl-Heinz',
    closing: 'Viele Grüße'
  },
  {
    id: 'wolfgang-weiler',
    firstName: 'Wolfgang',
    lastName: 'Weiler',
    email: 'wolfgang-h.weiler@t-online.de',
    isMember: true,
    tags: ['PC', 'Elektro'],
    greeting: 'Lieber Wolfgang',
    closing: 'Viele Grüße'
  },
  {
    id: 'karl-heinz-winterling',
    firstName: 'Karl-Heinz',
    lastName: 'Winterling',
    email: 'khwinterling@freenet.de',
    isMember: true,
    tags: ['Elektro'],
    greeting: 'Lieber Karl-Heinz',
    closing: 'Viele Grüße'
  }
];
