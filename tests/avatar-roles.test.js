import { beforeEach, describe, expect, it } from 'vitest'
import { createAccount, updateProfile, wipe } from '../src/account/store.js'
import { ROLE_PICKS, avatarEntry, fitsRole, initialsOf, isPhotoAvatar } from '../src/account/avatar-catalog.js'
import { VIEWER, viewerName } from '../src/account/viewer.js'
import { DEMO_CASELOAD, DEMO_LINKS, DEMO_PRO_PARENTS, DEMO_TEEN } from '../src/account/demo-network.js'

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
    expect(viewerName('student', 'demo', me)).toBe('Teen')
    expect(viewerName('parent', 'demo', null)).toBe('Parent')
    expect(viewerName('pro', 'demo', null)).toBe('Counselor')
    expect(viewerName('parent', 'real', me)).toBe('Dana')
    expect(viewerName('pro', 'real', { name: 'Dr. Lee' })).toBe('Dr. Lee')
    expect(viewerName('student', 'real', null)).toBe('')
  })
})

describe('the character suite', () => {
  it('draws the demo reader of each role as that role’s character', () => {
    expect(VIEWER.student.avatar).toBe('char-student')
    expect(VIEWER.parent.avatar).toBe('char-parent')
    expect(VIEWER.pro.avatar).toBe('char-counselor')
    for (const v of Object.values(VIEWER)) expect(avatarEntry(v.avatar)?.kind).toBe('char')
  })

  it('gives every demo person a character, each teen a different one', () => {
    const people = [DEMO_TEEN, ...DEMO_LINKS.map(l => l.person), ...DEMO_PRO_PARENTS.map(p => p.person),
      ...DEMO_CASELOAD.map(r => r.person)]
    for (const p of people) expect(p.avatar, p.name).toMatch(/^char-/)
    expect(DEMO_TEEN.avatar).toBe('char-maya')
    expect(DEMO_LINKS.find(l => l.person.name === 'Dr. Shah').person.avatar).toBe('char-shah')
    expect(DEMO_LINKS.find(l => l.person.name === 'Ms. Okafor').person.avatar).toBe('char-okafor')
    const teens = DEMO_CASELOAD.map(r => r.person.avatar)
    expect(new Set(teens).size).toBe(teens.length)
  })

  it('offers a parent the tree and a Counselor/Professional the talk bubble, not a teen', () => {
    expect(ROLE_PICKS.parent).toContain('emblem-tree')
    expect(ROLE_PICKS.pro).toContain('emblem-care')
    expect(fitsRole('parent', 'emblem-tree')).toBe(true)
    expect(fitsRole('pro', 'emblem-care')).toBe(true)
    expect(fitsRole('student', 'emblem-tree')).toBe(false)
    expect(fitsRole('student', 'fox')).toBe(true)
    expect(fitsRole('student', 'char-leo')).toBe(true)
    expect(fitsRole('parent', 'fox')).toBe(false)
    expect(fitsRole('parent', PHOTO)).toBe(true)
  })
})
