import PDFDocument from 'pdfkit'

export type PlanType = 'WEIGHT_GAIN' | 'WEIGHT_LOSS' | 'RECOMPOSITION'

export interface UserMetrics {
  name: string
  email: string
  heightCm?: number | null
  weightKg?: number | null
}

export interface GeneratedPlan {
  type: PlanType
  bmi?: number
  recommendations: string[]
  workoutsByDay: { day: number; focus: string; details: string[] }[]
  pdfBuffer: Buffer
}

const round = (n: number, d = 1) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d)

export function decidePlanType(heightCm?: number | null, weightKg?: number | null): { type: PlanType; bmi?: number } {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return { type: 'RECOMPOSITION' }
  }
  const hM = heightCm / 100
  const bmi = weightKg / (hM * hM)
  if (bmi < 18.5) return { type: 'WEIGHT_GAIN', bmi }
  if (bmi >= 25) return { type: 'WEIGHT_LOSS', bmi }
  return { type: 'RECOMPOSITION', bmi }
}

function baseRecommendations(type: PlanType): string[] {
  switch (type) {
    case 'WEIGHT_GAIN':
      return [
        'Calorie surplus: +300 to +500 kcal/day',
        'Protein: 1.6–2.2 g/kg bodyweight',
        'Carbs: 4–6 g/kg; Fats: 0.8–1.0 g/kg',
        'Progressive overload on compound lifts',
        '7–8 hours sleep, hydration 3L/day',
      ]
    case 'WEIGHT_LOSS':
      return [
        'Calorie deficit: -300 to -500 kcal/day',
        'Protein: 1.8–2.4 g/kg bodyweight to preserve muscle',
        'Daily steps: 8k–10k',
        'Mix of strength (3x/week) + cardio (2–3x/week)',
        'Prioritize whole foods and fiber',
      ]
    case 'RECOMPOSITION':
    default:
      return [
        'Slight surplus/deficit based on weekly progress',
        'Protein: ~2.0 g/kg bodyweight',
        'Strength training 3–4x/week + 1–2 cardio sessions',
        'Track measurements weekly; adjust calories by 150–200 kcal',
      ]
  }
}

function generateWorkoutSplit(type: PlanType): { day: number; focus: string; details: string[] }[] {
  const split = [
    { focus: 'Upper Body Strength', details: ['Bench Press 4x6–8', 'Row 4x6–8', 'OHP 3x8–10', 'Lat Pulldown 3x10–12', 'Core 10 min'] },
    { focus: 'Lower Body Strength', details: ['Squat 4x6–8', 'RDL 4x6–8', 'Leg Press 3x10–12', 'Calf Raise 3x12–15', 'Core 10 min'] },
    { focus: 'Cardio / Conditioning', details: ['Incline Walk 25–35 min or Intervals 15–20 min', 'Mobility 10 min'] },
    { focus: 'Push Hypertrophy', details: ['Incline DB Press 4x8–12', 'Cable Fly 3x12–15', 'Lateral Raise 4x12–15', 'Triceps Pressdown 3x10–12'] },
    { focus: 'Pull Hypertrophy', details: ['Pull-ups/Assisted 4x6–10', 'Chest Supported Row 4x8–12', 'Rear Delt Fly 3x12–15', 'Biceps Curl 3x10–12'] },
    { focus: 'Legs Hypertrophy', details: ['Front Squat/Leg Press 4x8–12', 'Romanian Deadlift 3x8–12', 'Lunges 3x10–12/leg', 'Ham Curl 3x10–12'] },
    { focus: 'Rest / Active Recovery', details: ['Light walk 20–30 min', 'Mobility/Stretching 15–20 min'] },
  ]

  // Emphasize cardio more on weight loss, strength more on gain
  if (type === 'WEIGHT_LOSS') split[2].details[0] = 'Cardio 30–45 min (moderate) or Intervals 20–25 min'
  if (type === 'WEIGHT_GAIN') split[2].details[0] = 'Optional light cardio 15–20 min; focus on recovery'

  // Repeat 4 weeks
  const days: { day: number; focus: string; details: string[] }[] = []
  for (let week = 0; week < 4; week++) {
    for (let i = 0; i < split.length; i++) {
      days.push({ day: week * 7 + (i + 1), focus: split[i].focus, details: split[i].details })
    }
  }
  return days
}

export async function generatePlanPDF(user: UserMetrics): Promise<GeneratedPlan> {
  const { type, bmi } = decidePlanType(user.heightCm, user.weightKg)
  const recommendations = baseRecommendations(type)
  const workoutsByDay = generateWorkoutSplit(type)

  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []
  const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
    doc.on('data', (c: Buffer | Uint8Array) => chunks.push(Buffer.from(c)))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(22).text('30-Day Workout & Nutrition Plan', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(12).text(`For: ${user.name} (${user.email})`)
    if (user.heightCm && user.weightKg) {
      doc.text(`Height: ${user.heightCm} cm, Weight: ${round(user.weightKg, 1)} kg`)
      if (bmi) doc.text(`BMI: ${round(bmi, 1)}`)
    }
    doc.text(`Plan Type: ${type.replace('_', ' ')}`)
    doc.moveDown()

    doc.fontSize(16).text('General Recommendations')
    doc.moveDown(0.5)
    doc.fontSize(11)
    recommendations.forEach((r) => doc.circle(doc.x - 6, doc.y + 6, 2).fillAndStroke('black').fillColor('black').text(`  ${r}`).moveDown(0.2))
    doc.moveDown()

    doc.fontSize(16).text('30-Day Schedule')
    doc.moveDown(0.5)
    doc.fontSize(11).fillColor('black')

    workoutsByDay.forEach((d) => {
      doc.font('Helvetica-Bold').text(`Day ${d.day}: ${d.focus}`)
      doc.font('Helvetica')
      d.details.forEach((line) => doc.text(`- ${line}`))
      doc.moveDown(0.5)
      if (doc.y > 760) doc.addPage()
    })

    doc.end()
  })

  return { type, bmi, recommendations, workoutsByDay, pdfBuffer }
}
