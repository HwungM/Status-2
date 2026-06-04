import { create } from 'zustand'
import { Character, Fandom } from '@/types'
import { FANDOMS } from '@/constants/fandoms'
import { CHARACTERS } from '@/constants/characters'
import { SCENARIOS } from '@/constants/scenarios'

export type { } from '@/types'

interface ScenarioStore {
  selectedFandom: string | null
  selectedCharacters: Character[]
  playerCharacterId: string | null
  firstFollowerCharacterId: string | null
  firstFollowerChemistry: string
  mainGoal: string
  worldSetting: string
  difficulty: 'easy' | 'normal' | 'hard'
  madnessScale: number

  setFandom: (fandomId: string | null) => void
  toggleCharacter: (character: Character) => void
  setPlayerCharacter: (characterId: string) => void
  setFirstFollower: (characterId: string) => void
  setFirstFollowerChemistry: (chemistry: string) => void
  setMainGoal: (goal: string) => void
  setWorldSetting: (setting: string) => void
  setDifficulty: (d: 'easy' | 'normal' | 'hard') => void
  setMadnessScale: (scale: number) => void
  resetPreset: () => void
  loadScenario: (scenarioId: string) => void
  getFilteredCharacters: (search: string) => Character[]
}

const defaultState = {
  selectedFandom: null,
  selectedCharacters: [] as Character[],
  playerCharacterId: null,
  firstFollowerCharacterId: null,
  firstFollowerChemistry: 'friends',
  mainGoal: '',
  worldSetting: '',
  difficulty: 'normal' as const,
  madnessScale: 50,
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  ...defaultState,

  setFandom: (fandomId) => set({ selectedFandom: fandomId }),

  toggleCharacter: (character) => {
    const { selectedCharacters } = get()
    const exists = selectedCharacters.find(c => c.id === character.id)
    if (exists) {
      set({ selectedCharacters: selectedCharacters.filter(c => c.id !== character.id) })
    } else if (selectedCharacters.length < 20) {
      set({ selectedCharacters: [...selectedCharacters, character] })
    }
  },

  setPlayerCharacter: (characterId) => set({ playerCharacterId: characterId }),

  setFirstFollower: (characterId) => set({ firstFollowerCharacterId: characterId }),

  setFirstFollowerChemistry: (chemistry) => set({ firstFollowerChemistry: chemistry }),

  setMainGoal: (goal) => set({ mainGoal: goal }),

  setWorldSetting: (setting) => set({ worldSetting: setting }),

  setDifficulty: (d) => set({ difficulty: d }),

  setMadnessScale: (scale) => set({ madnessScale: scale }),

  resetPreset: () => set({ ...defaultState }),

  loadScenario: (scenarioId) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) return
    set({
      selectedFandom: scenario.fandom,
      selectedCharacters: scenario.defaultCharacters,
      worldSetting: scenario.defaultWorldSetting,
      mainGoal: scenario.defaultMainGoal,
    })
  },

  getFilteredCharacters: (search) => {
    const { selectedFandom } = get()
    return CHARACTERS.filter(c => {
      if (selectedFandom && c.fandom !== selectedFandom) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
          !c.handle.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  },
}))
