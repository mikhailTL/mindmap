import { beforeEach, describe, expect, it } from 'vitest'
import { createAccount, updateProfile, wipe } from '../src/account/store.js'
import { initialsOf, isPhotoAvatar } from '../src/account/avatar-catalog.js'
import { viewerName } from '../src/account/viewer.js'

/* Owner, 18 October: teens pick the drawings, parents initials or a photo,
   Counselors/Professionals a photo; the demo greets the reader by role. */

const PHOTO = 'data:image/jpeg;base64,' + 'A'.repeat(400)

beforeEach(() => wipe())

describe('avatars by role', () => {
  it('keeps a photo for a parent and a pro, never for a teen', async () => {
    expect(isPhotoAvatar(PHOTO)).toBe(true)
    expect(isPhotoAvatar('data:text/html;base64,AAAA')).toBe(false)
    const p = await createAccount({ role: 'parent', name: 'Dana', passcode: '1234', email: 'd@example.com', avatar: PHOTO })
    expect(p.account.avatar).toBe(PHOTO)
    wipe()
    const s = await createAccount({ role: 'student', name: 'Sam', passcode: '1234', avatar: PHOTO })
    expect(s.account.avatar).toBeNull()
    expect(updateProfile({ avatar: PHOTO }).avatar).toBeNull()
    expect(updateProfile({ avatar: 'fox' }).avatar).toBe('fox')
  })

  it('makes initials without a title', () => {
    expect(initialsOf('Dr. Shah')).toBe('S')
    expect(initialsOf('Rosa Diaz')).toBe('RD')
    expect(initialsOf('')).toBe('')
  })
})

describe('the reader’s name', () => {
  it('is the role word in the demo and the account name in Live', () => {
    const me = { name: 'Dana Cruz' }
    expect(viewerName('student', 'demo', me)).toBe('Student')
    expect(viewerName('parent', 'demo', null)).toBe('Parent')
    expect(viewerName('pro', 'demo', null)).toBe('Counselor')
    expect(viewerName('parent', 'real', me)).toBe('Dana')
    expect(viewerName('pro', 'real', { name: 'Dr. Lee' })).toBe('Dr. Lee')
    expect(viewerName('student', 'real', null)).toBe('')
  })
})
