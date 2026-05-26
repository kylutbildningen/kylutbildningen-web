import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '3nwk1dxf',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const dagSchema = [
  {
    _key: 'dag1', _type: 'dag', dagTitel: 'Dag 1', dagSubtitel: 'Teori',
    pass: [
      { _key: 's1', _type: 'pass', tid: '09:00', typ: 'lesson', aktiviteter: [
        'Inledning, program och praktiska upplysningar',
        'Thermodynamikens grunder',
        'Allmän värmelära',
      ] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's3', _type: 'pass', tid: '10:30', typ: 'lesson', aktiviteter: [
        'Kylprocessens uppbyggnad och funktion',
        'Förångningsprocessen',
        'Definitioner',
        'Huvudkomponenter: kompressorer, förångare, mellankylare',
        'Värmeväxlare, kondensorer, stryporgan',
      ] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break',  aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: [
        'Kylprocessens komponenter',
        'Kompressorer',
        'Värmeväxlare',
        'Stryporgan',
        'Tryck- och temperaturvakter',
        'Torkfilter, synglas',
        'Oljetrycksvakter',
      ] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's7', _type: 'pass', tid: '15:30', typ: 'lesson', aktiviteter: [
        'Mätövningar — kännetecken för normal gång',
        'Inställning av pressostater (högtrycks- och lågtrycksvakter)',
      ] },
      { _key: 's8', _type: 'pass', tid: '17:00', typ: 'end',    aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag2', _type: 'dag', dagTitel: 'Dag 2', dagSubtitel: 'Köldmedieteknik & praktik',
    pass: [
      { _key: 's1', _type: 'pass', tid: '08:30', typ: 'lesson', aktiviteter: [
        'Köldmedieteknik',
        'Typer och egenskaper',
        'Ångtryckskurvor',
        'Temperatur- och trycknivåer',
        'Samband olja',
      ] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's3', _type: 'pass', tid: '10:30', typ: 'lesson', aktiviteter: [
        'Nya köldmedier',
        'Användningsområden',
        'Konvertering av befintliga system',
      ] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break',  aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: [
        'Praktik: Köldmediehantering',
        'Utrustning för tömning och fyllning',
        'Tömning',
        'Evakuering',
        'Fyllning',
      ] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's7', _type: 'pass', tid: '15:30', typ: 'lesson', aktiviteter: [
        'Kontroll av säkerhetsutrustning',
        'Högtryckspressostat',
        'Lågtryckspressostat',
        'Frysskydd',
      ] },
      { _key: 's8', _type: 'pass', tid: '17:00', typ: 'end',    aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag3', _type: 'dag', dagTitel: 'Dag 3', dagSubtitel: 'Drifttagning & styrsystem',
    pass: [
      { _key: 's1', _type: 'pass', tid: '08:30', typ: 'lesson', aktiviteter: [
        'Drifttagning av kylanläggning',
        'Kontrollmoment',
        'Checklistor',
        'Utrustning för drifttagning',
      ] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's3', _type: 'pass', tid: '10:30', typ: 'lesson', aktiviteter: [
        'El – styr – reglersystem',
        'Styrsystem',
        'Diaserie',
        'Pump down system',
      ] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break',  aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: [
        'Praktik: Drifttagning av system',
        'Injustering',
        'Kondensortryck',
        'Expansionsventil — kontroll och överhettning',
      ] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's7', _type: 'pass', tid: '15:30', typ: 'lesson', aktiviteter: [
        'Inställning av motorskydd',
        'Kontroll av inställvärden',
      ] },
      { _key: 's8', _type: 'pass', tid: '17:00', typ: 'end',    aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag4', _type: 'dag', dagTitel: 'Dag 4', dagSubtitel: 'Praktik',
    pass: [
      { _key: 's1', _type: 'pass', tid: '08:30', typ: 'lesson', aktiviteter: [
        'Praktik: Tömning av köldmedium',
      ] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's3', _type: 'pass', tid: '10:30', typ: 'lesson', aktiviteter: [
        'Praktik: Injustering av expansionsventil',
        'Fyllning av köldmedium',
      ] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break',  aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: [
        'Praktik: Läcksökning',
        'Optimering och injustering',
      ] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's7', _type: 'pass', tid: '15:30', typ: 'lesson', aktiviteter: [
        'Praktik: Märkning av system',
      ] },
      { _key: 's8', _type: 'pass', tid: '17:00', typ: 'end',    aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag5', _type: 'dag', dagTitel: 'Dag 5', dagSubtitel: 'Felsökning & underhåll',
    pass: [
      { _key: 's1', _type: 'pass', tid: '08:30', typ: 'lesson', aktiviteter: [
        'Felsökningsteknik kylanläggningar',
        'Köldmediesystemets felfunktioner',
      ] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's3', _type: 'pass', tid: '10:30', typ: 'lesson', aktiviteter: [
        'Metoder och utrustning',
        'Checklistor',
      ] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break',  aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: [
        'Drift och underhåll av kylsystem',
        'Förebyggande underhåll — metoder och utrustning',
      ] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break',  aktiviteter: ['Fika'] },
      { _key: 's7', _type: 'pass', tid: '15:30', typ: 'lesson', aktiviteter: [
        'Avhjälpande underhåll',
        'Driftsinstruktioner',
      ] },
      { _key: 's8', _type: 'pass', tid: '17:00', typ: 'end',    aktiviteter: ['Slut för dagen'] },
    ],
  },
]

const doc = await client.fetch(
  `*[_type == "coursePage" && slug.current == "praktisk-kylteknik-5-dagar"][0]{ _id, title }`
)

if (!doc?._id) {
  console.error('✗ Hittade inte coursePage med slug "praktisk-kylteknik-5-dagar"')
  process.exit(1)
}

console.log(`Uppdaterar dagschema för ${doc.title} (${doc._id})...`)

try {
  await client.patch(doc._id).set({ dagSchema }).commit()
  console.log(`✓ Uppdaterat ${doc.title}`)
} catch (err) {
  console.error(`✗ ${doc._id}: ${err.message}`)
  process.exit(1)
}
