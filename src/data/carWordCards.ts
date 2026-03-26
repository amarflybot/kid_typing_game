export type CarWordCard = {
  word: string
  emoji: string
  mission: string
  colors: readonly [string, string]
}

export const CAR_WORD_CARDS = [
  { word: 'car', emoji: '🏎️', mission: 'Hit the gas for the race car!', colors: ['#f5576c', '#f093fb'] },
  { word: 'bus', emoji: '🚌', mission: 'Pick up friends on the bus!', colors: ['#fbd786', '#f7797d'] },
  { word: 'van', emoji: '🚐', mission: 'Pack the adventure van!', colors: ['#84fab0', '#8fd3f4'] },
  { word: 'cab', emoji: '🚕', mission: 'Call the speedy cab!', colors: ['#f6d365', '#fda085'] },
  { word: 'gas', emoji: '⛽', mission: 'Fuel up the tank!', colors: ['#fceabb', '#f8b500'] },
  { word: 'oil', emoji: '🛢️', mission: 'Oil the engine!', colors: ['#d5d4d0', '#fff1eb'] },
  { word: 'key', emoji: '🔑', mission: 'Twist the shiny key!', colors: ['#c6ffdd', '#fbd786'] },
  { word: 'map', emoji: '🗺️', mission: 'Plan the rally map!', colors: ['#c471f5', '#fa71cd'] },
  { word: 'lap', emoji: '♾️', mission: 'Finish the hot lap!', colors: ['#ffecd2', '#fcb69f'] },
  { word: 'pit', emoji: '🏁', mission: 'Zip into the pit stop!', colors: ['#a1c4fd', '#c2e9fb'] },
  { word: 'rim', emoji: '🛞', mission: 'Shine the wheel rim!', colors: ['#d4fc79', '#96e6a1'] },
  { word: 'lug', emoji: '🔩', mission: 'Tighten the lug nuts!', colors: ['#e0c3fc', '#8ec5fc'] },
  { word: 'rev', emoji: '🎛️', mission: 'Rev the roaring engine!', colors: ['#ff9a9e', '#fecfef'] },
  { word: 'jet', emoji: '🛩️', mission: 'Jet boost the car!', colors: ['#667db6', '#0082c8'] },
  { word: 'tow', emoji: '🚨', mission: 'Call the tow crew!', colors: ['#fff1eb', '#ace0f9'] },
  { word: 'zip', emoji: '⚡', mission: 'Zip past the finish!', colors: ['#fda085', '#f6d365'] },
  { word: 'tax', emoji: '💸', mission: 'Pay the race tax!', colors: ['#fbc2eb', '#a6c1ee'] },
  { word: 'hub', emoji: '⚙️', mission: 'Grease the hub!', colors: ['#fdfbfb', '#ebedee'] },
] satisfies CarWordCard[]

export type CarWord = (typeof CAR_WORD_CARDS)[number]['word']

export const CAR_LOOKUP: Record<CarWord, CarWordCard> = CAR_WORD_CARDS.reduce<Record<CarWord, CarWordCard>>(
  (map, card) => {
    map[card.word as CarWord] = card
    return map
  },
  {} as Record<CarWord, CarWordCard>
)

export const CAR_WORDS: CarWord[] = CAR_WORD_CARDS.map((card) => card.word as CarWord)
