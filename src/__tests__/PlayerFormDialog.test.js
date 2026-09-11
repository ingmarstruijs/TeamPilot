import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PlayerFormDialog from '../components/players/PlayerFormDialog.vue'

describe('PlayerFormDialog', () => {
  it('pre-checks guest when opened as a borrowed player', async () => {
    const wrapper = mount(PlayerFormDialog, {
      props: {
        open: true,
        title: 'Geleende speler toevoegen',
        submitLabel: 'Toevoegen',
        defaultGuest: true,
      },
    })
    await flushPromises()

    expect(wrapper.get('#player-form-name').exists()).toBe(true)
    expect(wrapper.get('#player-form-num').exists()).toBe(true)
    const guest = wrapper.findAll('input[type="checkbox"]')[1]
    expect(guest.element.checked).toBe(true)

    await wrapper.get('#player-form-name').setValue('Nora')
    await wrapper.get('.btn-filled').trigger('click')
    expect(wrapper.emitted('save')[0][0].guest).toBe(true)
    expect(wrapper.emitted('save')[0][0].name).toBe('Nora')
  })
})
