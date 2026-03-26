const WORD_CARD_DATA = [
  { word: 'cat', emoji: '🐱', label: 'Playful Cat', colors: ['#ffd1dc', '#ff9a8b'], mission: 'Wake up the cuddly kitty word!' },
  { word: 'dog', emoji: '🐶', label: 'Happy Dog', colors: ['#d4fc79', '#96e6a1'], mission: 'Call the happy puppy word!' },
  { word: 'sun', emoji: '☀️', label: 'Sunny Sun', colors: ['#fddb92', '#f8b500'], mission: 'Shine the bright sun word!' },
  { word: 'car', emoji: '🚗', label: 'Speedy Car', colors: ['#f5576c', '#f093fb'], mission: 'Start the speedy car word!' },
  { word: 'bus', emoji: '🚌', label: 'School Bus', colors: ['#fbd786', '#f7797d'], mission: 'Drive the school bus word!' },
  { word: 'bee', emoji: '🐝', label: 'Busy Bee', colors: ['#f6d365', '#fda085'], mission: 'Buzz with the busy bee!' },
  { word: 'fox', emoji: '🦊', label: 'Clever Fox', colors: ['#f3904f', '#ff758c'], mission: 'Sneak with the clever fox!' },
  { word: 'owl', emoji: '🦉', label: 'Wise Owl', colors: ['#cbbacc', '#2580b3'], mission: 'Hoot with the wise owl word!' },
  { word: 'pig', emoji: '🐷', label: 'Pink Pig', colors: ['#fbc2eb', '#a6c1ee'], mission: 'Oink with the pink pig word!' },
  { word: 'cow', emoji: '🐮', label: 'Gentle Cow', colors: ['#d5d4d0', '#fff1eb'], mission: 'Moo with the gentle cow word!' },
  { word: 'ant', emoji: '🐜', label: 'Tiny Ant', colors: ['#c6ffdd', '#fbd786'], mission: 'March with the tiny ant word!' },
  { word: 'bug', emoji: '🐞', label: 'Lucky Bug', colors: ['#f83600', '#f9d423'], mission: 'Spot the lucky bug word!' },
  { word: 'bat', emoji: '🦇', label: 'Night Bat', colors: ['#cfd9df', '#e2ebf0'], mission: 'Flip with the night bat word!' },
  { word: 'hat', emoji: '🎩', label: 'Magic Hat', colors: ['#fdfbfb', '#ebedee'], mission: 'Pop on the magic hat word!' },
  { word: 'map', emoji: '🗺️', label: 'Explorer Map', colors: ['#84fab0', '#8fd3f4'], mission: 'Find the explorer map word!' },
  { word: 'jam', emoji: '🍓', label: 'Berry Jam', colors: ['#ff9a9e', '#fecfef'], mission: 'Spread the berry jam word!' },
  { word: 'run', emoji: '🏃‍♂️', label: 'Fast Run', colors: ['#f7ff00', '#db36a4'], mission: 'Dash with the fast run word!' },
  { word: 'toy', emoji: '🪀', label: 'Fun Toy', colors: ['#c471f5', '#fa71cd'], mission: 'Play with the fun toy word!' },
  { word: 'cup', emoji: '☕', label: 'Cozy Cup', colors: ['#fbd3e9', '#bb377d'], mission: 'Sip from the cozy cup word!' },
  { word: 'egg', emoji: '🥚', label: 'Tiny Egg', colors: ['#e0c3fc', '#8ec5fc'], mission: 'Crack the tiny egg word!' },
  { word: 'fin', emoji: '🐠', label: 'Fish Fin', colors: ['#a1c4fd', '#c2e9fb'], mission: 'Swish the fish fin word!' },
  { word: 'log', emoji: '🪵', label: 'Forest Log', colors: ['#f5f7fa', '#c3cfe2'], mission: 'Balance on the forest log word!' },
  { word: 'rug', emoji: '🧩', label: 'Play Rug', colors: ['#ffecd2', '#fcb69f'], mission: 'Jump on the play rug word!' },
  { word: 'hug', emoji: '🤗', label: 'Warm Hug', colors: ['#fbd786', '#c6ffdd'], mission: 'Share the warm hug word!' },
  { word: 'kid', emoji: '🧒', label: 'Bright Kid', colors: ['#ffecd2', '#fcb69f'], mission: 'Spell the bright kid power word!' },
] as const

export type Word = (typeof WORD_CARD_DATA)[number]['word']
export type WordCard = (typeof WORD_CARD_DATA)[number]

export const WORD_CARDS: WordCard[] = [...WORD_CARD_DATA]

export const WORD_LOOKUP: Record<Word, WordCard> = WORD_CARDS.reduce<Record<Word, WordCard>>((map, card) => {
  map[card.word] = card
  return map
}, {} as Record<Word, WordCard>)

export const WORDS: Word[] = WORD_CARDS.map((card) => card.word)
