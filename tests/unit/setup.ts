import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Tanpa ini, DOM dari test sebelumnya menumpuk dan query getByRole jadi ambigu.
afterEach(() => {
  cleanup()
})
