import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '3nwk1dxf',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const schemaKatIII = [
  {
    _key: 'dag1', _type: 'dag', dagTitel: 'Dag 1', dagSubtitel: 'Teori',
    pass: [
      { _key: 's1', _type: 'pass', tid: '09:00', typ: 'lesson', aktiviteter: ['Miljö', 'SFS 2016:1128 Växthusnedbrytande ämnen'] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's3', _type: 'pass', tid: '10:20', typ: 'lesson', aktiviteter: ['SFS 2016:1129 Ozonnedbrytande ämnen', 'SFS 2016:1128 Växthusnedbrytande ämnen', 'Mac Direktivet'] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break', aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: ['SFS 2016:1128 Växthusnedbrytande ämnen', 'EG Nr 2024/574 F-gasförordningen', 'EG Nr 1516/2007 Läcksökning'] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's7', _type: 'pass', tid: '15:20', typ: 'lesson', aktiviteter: ['H28 Kompendiet'] },
      { _key: 's8', _type: 'pass', tid: '16:30', typ: 'end', aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag2', _type: 'dag', dagTitel: 'Dag 2', dagSubtitel: 'Teori',
    pass: [
      { _key: 's1', _type: 'pass', tid: '09:00', typ: 'lesson', aktiviteter: ['SFS 2016:1128 Växthusnedbrytande ämnen', 'EG Nr 2024/574 F-gasförordningen'] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's3', _type: 'pass', tid: '10:20', typ: 'lesson', aktiviteter: ['SFS 2016:1128 Växthusnedbrytande ämnen', 'EG Nr 2024/574 F-gasförordningen'] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break', aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: ['EG Nr 2024/574 F-gasförordningen', 'EG Nr 1516/2007 Läcksökning'] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's7', _type: 'pass', tid: '15:20', typ: 'lesson', aktiviteter: ['H28 Kompendiet'] },
      { _key: 's8', _type: 'pass', tid: '16:30', typ: 'end', aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag3', _type: 'dag', dagTitel: 'Provdag', dagSubtitel: 'Examination',
    pass: [
      { _key: 's1', _type: 'pass', tid: '08:45', typ: 'lesson', aktiviteter: ['SFS 2016:1128 Växthusnedbrytande ämnen', 'EG Nr 2024/574 F-gasförordningen'] },
      { _key: 's2', _type: 'pass', tid: '09:00', typ: 'exam', aktiviteter: ['Teoretiskt prov — 2 timmar'] },
      { _key: 's3', _type: 'pass', tid: '12:00', typ: 'break', aktiviteter: ['Lunch'] },
      { _key: 's4', _type: 'pass', tid: '13:00', typ: 'exam', aktiviteter: ['Praktiskt prov — 4 timmar', 'EG Nr 1516/2007 Läcksökning · SKN Faktablad 4'] },
      { _key: 's5', _type: 'pass', tid: '18:00', typ: 'end', aktiviteter: ['Slut'] },
    ],
  },
]

const schemaKatV = [
  {
    _key: 'dag1', _type: 'dag', dagTitel: 'Dag 1', dagSubtitel: 'Teori',
    pass: [
      { _key: 's1', _type: 'pass', tid: '09:00', typ: 'lesson', aktiviteter: ['Miljö', 'SFS 2016:1128 Växthusnedbrytande ämnen'] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's3', _type: 'pass', tid: '10:20', typ: 'lesson', aktiviteter: ['SFS 2016:1129 Ozonnedbrytande ämnen', 'Mac Direktivet', 'EG Nr 2024/574 F-gasförordningen'] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break', aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: ['EG Nr 2024/574 F-gasförordningen', 'EG Nr 1516/2007 Läcksökning'] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's7', _type: 'pass', tid: '15:20', typ: 'lesson', aktiviteter: ['H28 Kompendiet'] },
      { _key: 's8', _type: 'pass', tid: '16:30', typ: 'end', aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag2', _type: 'dag', dagTitel: 'Dag 2', dagSubtitel: 'Teori',
    pass: [
      { _key: 's1', _type: 'pass', tid: '09:00', typ: 'lesson', aktiviteter: ['EG Nr 2024/574 F-gasförordningen', 'EG Nr 1516/2007 Läcksökning'] },
      { _key: 's2', _type: 'pass', tid: '10:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's3', _type: 'pass', tid: '10:20', typ: 'lesson', aktiviteter: ['EG Nr 2024/574 F-gasförordningen', 'H28 Kompendiet'] },
      { _key: 's4', _type: 'pass', tid: '12:00', typ: 'break', aktiviteter: ['Lunch'] },
      { _key: 's5', _type: 'pass', tid: '13:00', typ: 'lesson', aktiviteter: ['EG Nr 2024/574 F-gasförordningen', 'SKN Faktablad 4'] },
      { _key: 's6', _type: 'pass', tid: '15:00', typ: 'break', aktiviteter: ['Kaffe'] },
      { _key: 's7', _type: 'pass', tid: '15:20', typ: 'lesson', aktiviteter: ['H28 Kompendiet'] },
      { _key: 's8', _type: 'pass', tid: '16:30', typ: 'end', aktiviteter: ['Slut för dagen'] },
    ],
  },
  {
    _key: 'dag3', _type: 'dag', dagTitel: 'Provdag', dagSubtitel: 'Examination',
    pass: [
      { _key: 's1', _type: 'pass', tid: '08:45', typ: 'lesson', aktiviteter: ['SFS 2016:1128 Växthusnedbrytande ämnen', 'EG Nr 2024/574 F-gasförordningen'] },
      { _key: 's2', _type: 'pass', tid: '09:00', typ: 'exam', aktiviteter: ['Teoretiskt prov — 2 timmar'] },
      { _key: 's3', _type: 'pass', tid: '12:00', typ: 'break', aktiviteter: ['Lunch'] },
      { _key: 's4', _type: 'pass', tid: '13:00', typ: 'exam', aktiviteter: ['Praktiskt prov — 4 timmar', 'SKN Faktablad 4'] },
      { _key: 's5', _type: 'pass', tid: '18:00', typ: 'end', aktiviteter: ['Slut'] },
    ],
  },
]

const updates = [
  { id: 'course-kategori-i-ii', schema: schemaKatIII },
  { id: 'course-kategori-v', schema: schemaKatV },
]

console.log('Uppdaterar dagscheman...')
for (const { id, schema } of updates) {
  try {
    await client.patch(id).set({ dagSchema: schema }).commit()
    console.log(`✓ ${id}`)
  } catch (err) {
    console.error(`✗ ${id}: ${err.message}`)
  }
}
console.log('\nKlar!')
