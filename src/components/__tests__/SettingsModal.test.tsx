import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SettingsModal from '../SettingsModal'
import type { Settings } from '@/hooks/useSettings'

const DEFAULT_SETTINGS: Settings = {
  textSpeed: 'normal',
  musicVolume: 80,
  sfxVolume: 80,
  scale: 3,
}

describe('SettingsModal', () => {
  it("does not render when isOpen=false", () => {
    render(
      <SettingsModal
        isOpen={false}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onSettingChange={vi.fn()}
      />
    )
    expect(screen.queryByTestId('settings-modal')).toBeNull()
  })

  it("renders with data-testid='settings-modal' when isOpen=true", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onSettingChange={vi.fn()}
      />
    )
    expect(screen.getByTestId('settings-modal')).toBeTruthy()
  })

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        settings={DEFAULT_SETTINGS}
        onSettingChange={vi.fn()}
      />
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        settings={DEFAULT_SETTINGS}
        onSettingChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTestId('settings-modal'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when CLOSE button is clicked", () => {
    const onClose = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        settings={DEFAULT_SETTINGS}
        onSettingChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('CLOSE'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onSettingChange with 'textSpeed' when SLOW is clicked", () => {
    const onSettingChange = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onSettingChange={onSettingChange}
      />
    )
    fireEvent.click(screen.getByText('SLOW'))
    expect(onSettingChange).toHaveBeenCalledWith('textSpeed', 'slow')
  })

  it("calls onSettingChange with 'textSpeed' when FAST is clicked", () => {
    const onSettingChange = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onSettingChange={onSettingChange}
      />
    )
    fireEvent.click(screen.getByText('FAST'))
    expect(onSettingChange).toHaveBeenCalledWith('textSpeed', 'fast')
  })

  it("calls onSettingChange with 'musicVolume' when music slider changes", () => {
    const onSettingChange = vi.fn()
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onSettingChange={onSettingChange}
      />
    )
    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[0], { target: { value: '50' } })
    expect(onSettingChange).toHaveBeenCalledWith('musicVolume', 50)
  })

  it("shows current music volume percentage", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, musicVolume: 65 }}
        onSettingChange={vi.fn()}
      />
    )
    expect(screen.getByText(/MUSIC 65%/)).toBeTruthy()
  })

  it("highlights active text speed button", () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...DEFAULT_SETTINGS, textSpeed: 'fast' }}
        onSettingChange={vi.fn()}
      />
    )
    const fastBtn = screen.getByText('FAST')
    // Active button has bg-[#566c86] class
    expect(fastBtn.className).toContain('bg-[#566c86]')
  })
})
