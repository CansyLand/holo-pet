// EPIC: Pet Care Interactions - Petting Interaction Story (Pet Menu)
// Pet menu that appears when clicking on pet.
// Shows care options and current pet status.

import { game } from '../Game'
import { focus } from '../services/Focus'

export interface MenuButton {
  id: string
  label: string
  icon: string
  action: () => void
  enabled: boolean
}

export class MenuUI {
  private isVisible = false
  private menuButtons: MenuButton[] = []
  private petEntity: any = null

  constructor() {
    console.log('🎛️ Menu UI initialized')
    this.initializeButtons()
  }

  private initializeButtons() {
    this.menuButtons = [
      {
        id: 'pet',
        label: 'Pet',
        icon: '🐾',
        action: () => game.petPet(),
        enabled: true
      },
      {
        id: 'feed',
        label: 'Feed',
        icon: '🍽️',
        action: () => game.feedPet(),
        enabled: true
      },
      {
        id: 'play',
        label: 'Play',
        icon: '🏀',
        action: () => game.playWithPet(),
        enabled: true
      },
      {
        id: 'bath',
        label: 'Bath',
        icon: '🛁',
        action: () => game.bathePet(),
        enabled: true
      },
      {
        id: 'sleep',
        label: 'Sleep',
        icon: '🛏️',
        action: () => game.putPetToSleep(),
        enabled: true
      },
      {
        id: 'close',
        label: 'Close',
        icon: '✕',
        action: () => this.hide(),
        enabled: true
      }
    ]
    console.log('🎛️ Menu buttons initialized')
  }

  show(petEntity: any) {
    this.isVisible = true
    this.petEntity = petEntity

    // Focus camera on pet
    focus.focusOn(petEntity)

    this.render()
    console.log('🎛️ Pet menu shown')
  }

  hide() {
    this.isVisible = false

    // Unfocus camera
    focus.unfocus()

    this.petEntity = null
    console.log('🎛️ Pet menu hidden')
  }

  private render() {
    // TODO: Render menu buttons around the pet
    // TODO: Position buttons in a circle or grid around focused pet
    // TODO: Use 3D UI elements or screen-space overlay
    console.log('🎛️ Rendering pet menu')
  }

  // Handle button clicks
  onButtonClick(buttonId: string) {
    const button = this.menuButtons.find((b) => b.id === buttonId)
    if (button && button.enabled) {
      console.log(`🎛️ Menu button clicked: ${buttonId}`)
      button.action()

      // Close menu after action (except for close button)
      if (buttonId !== 'close') {
        this.hide()
      }
    }
  }

  // Update button states based on pet condition
  updateButtonStates() {
    if (!game.state.pet) return

    const pet = game.state.pet

    // Disable feeding if not hungry
    this.menuButtons.find((b) => b.id === 'feed')!.enabled = pet.data.hunger > 20

    // Disable bathing if already clean
    this.menuButtons.find((b) => b.id === 'bath')!.enabled = pet.data.cleanliness < 80

    // Disable sleep if already sleeping or full energy
    this.menuButtons.find((b) => b.id === 'sleep')!.enabled = pet.data.state !== 'sleeping' && pet.data.energy < 90

    console.log('🎛️ Menu button states updated')
  }

  // Get menu button positions (for 3D placement)
  getButtonPositions(): any[] {
    // TODO: Calculate positions in circle around pet
    // Return array of { x, y, z, button } objects
    return []
  }

  isCurrentlyVisible(): boolean {
    return this.isVisible
  }

  // Handle escape key to close menu
  handleEscape() {
    if (this.isVisible) {
      this.hide()
    }
  }
}

export const menuUI = new MenuUI()
