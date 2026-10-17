import { beforeEach, describe, expect, it } from 'vitest'
import {
  AVATAR_ALL_IDS, AVATAR_IDS, ROLES, SETTINGS, homeFor, approveLink, changePasscode, createAccount, createInvite, current,
  declineLink, deleteAccount, exportAll, listNetwork, listPendingApprovals, redeemInvite,
  removeLink, signIn, signOut, updateProfile, wipe,
} from '../src/account/store.js'

/* Accounts, links and invitations are kept on this device. These tests run
   with no window at all, so every localStorage touch has to degrade to the
   in-memory copy, and the whole flow has to be complete without a server:
   a pro invites, a student redeems, a parent approves, all on one device by
   signing in and out in turn. */

/* Email is required for a parent and a professional, optional for a
   student; a professional also says where they work. */
const EXTRA = {
  student: {},
  parent: { email: 'dana@example.com' },
  pro: { email: 'lee@example.com', setting: 'school' },
  other: {},
}
async function make(role, name, passcode = '1234', extra = {}) {
  const r = await createAccount({ role, name, passcode, ...EXTRA[role], ...extra })
  expect(r.ok, `${role} ${name} ${r.reason}`).toBe(true)
  return r.account
}

/* The parent, the student and the pro, each with an account, and the parent
   already linked to the student through the parent's own code. */
async function family() {
  const parent = await make('parent', 'Dana')
  const invite = createInvite()
  signOut()
  const student = await make('student', 'Sam', '2468')
  const red = redeemInvite(invite.code)
  expect(red.ok).toBe(true)
  expect(red.link.status).toBe('active')
  signOut()
  const pro = await make('pro', 'Dr Lee', '975310')
  signOut()
  return { parent, student, pro }
}

/* Ambiguous glyphs are out of the alphabet: no 0/O, no 1/I/L. */
const CODE = /^[A-HJ-KM-NP-Z2-9]{6}$/

beforeEach(() => wipe())

describe('accounts', () => {
  it('creates an account with a hashed passcode and signs it in', async () => {
    const a = await make('student', 'Sam', '2468')
    expect(a.id).toBeTruthy()
    expect(a.role).toBe('student')
    expect(a.name).toBe('Sam')
    expect(a.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(a.passcodeHash).toMatch(/^[0-9a-f]{64}$/)
    expect(a.passcodeHash).not.toContain('2468')
    expect(a.email).toBeNull()
    expect(a.avatar).toBeNull()
    expect(a.setting).toBeNull()
    expect(current()?.id).toBe(a.id)
  })

  it('records the last sign-in time on the account', async () => {
    const a = await make('student', 'Sam', '2468')
    expect(a.lastSignInAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    signOut()
    await new Promise(r => setTimeout(r, 5))
    await signIn('Sam', '2468')
    expect(current().lastSignInAt > a.lastSignInAt).toBe(true)
    expect(JSON.parse(exportAll()).account.lastSignInAt).toBe(current().lastSignInAt)
  })

  it('keeps an avatar id, an email and a professional setting on the account', async () => {
    expect(AVATAR_IDS.length).toBe(12)
    expect(AVATAR_IDS).toEqual(['fox', 'owl', 'panda', 'frog', 'cat', 'bear',
                                'koala', 'penguin', 'bunny', 'whale', 'hedgehog', 'sloth'])
    const a = await make('pro', 'Dr Lee', '975310', { avatar: AVATAR_IDS[3], setting: 'practice' })
    expect(a.avatar).toBe(AVATAR_IDS[3])
    expect(a.email).toBe('lee@example.com')
    expect(a.setting).toBe('practice')
    expect(updateProfile({ avatar: AVATAR_IDS[7] }).avatar).toBe(AVATAR_IDS[7])
    expect(updateProfile({ avatar: 'not-an-avatar' }).avatar).toBe(AVATAR_IDS[7])
    expect(updateProfile({ avatar: null }).avatar).toBeNull()
    expect(updateProfile({ setting: 'other' }).setting).toBe('other')
    expect(updateProfile({ setting: 'nowhere' }).setting).toBe('other')
    expect(updateProfile({ email: ' Lee@Clinic.org ' }).email).toBe('lee@clinic.org')
    expect(SETTINGS.map(s => s.value)).toEqual(['school', 'practice', 'other'])
  })

  it('requires an email for a parent and a professional, and a setting for a professional', async () => {
    expect((await createAccount({ role: 'parent', name: 'Dana', passcode: '1234' })).reason).toBe('email')
    expect((await createAccount({ role: 'parent', name: 'Dana', passcode: '1234', email: 'nope' })).reason).toBe('email')
    expect((await createAccount({ role: 'pro', name: 'Dr Lee', passcode: '1234', email: 'lee@example.com' })).reason).toBe('setting')
    const s = await createAccount({ role: 'student', name: 'Sam', passcode: '1234' })
    expect(s.ok).toBe(true)
    expect(s.account.email).toBeNull()
    /* A student may not set a setting. */
    expect(updateProfile({ setting: 'school' }).setting).toBeNull()
  })

  it('refuses a second account with the same email', async () => {
    await make('parent', 'Dana')
    signOut()
    const r = await createAccount({ role: 'pro', name: 'Dr Lee', passcode: '1234', email: 'DANA@example.com', setting: 'school' })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('taken')
  })

  it('signs in with a name or an email', async () => {
    await make('parent', 'Dana', '1234')
    signOut()
    expect(await signIn('dana@example.com', '1234')).toBe('ok')
    signOut()
    expect(await signIn('Dana@Example.com', '0000')).toBe('wrong')
    expect(await signIn('dana', '1234')).toBe('ok')
  })

  it('refuses a passcode outside four to six digits, and a blank name', async () => {
    expect((await createAccount({ role: 'student', name: 'Sam', passcode: '123' })).ok).toBe(false)
    expect((await createAccount({ role: 'student', name: 'Sam', passcode: '1234567' })).ok).toBe(false)
    expect((await createAccount({ role: 'student', name: 'Sam', passcode: 'abcd' })).ok).toBe(false)
    expect((await createAccount({ role: 'student', name: '  ', passcode: '1234' })).ok).toBe(false)
    expect((await createAccount({ role: 'teacher', name: 'Sam', passcode: '1234' })).ok).toBe(false)
    expect(current()).toBeNull()
  })

  it('refuses a second account with the same name', async () => {
    await make('student', 'Sam')
    signOut()
    const r = await createAccount({ role: 'parent', name: 'sam', passcode: '1234', email: 'sam@example.com' })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('taken')
  })

  it('signs in with the right passcode and not with the wrong one', async () => {
    await make('student', 'Sam', '2468')
    signOut()
    expect(current()).toBeNull()
    expect(await signIn('Sam', '0000')).toBe('wrong')
    expect(current()).toBeNull()
    expect(await signIn('Nobody', '2468')).toBe('wrong')
    expect(await signIn('sam', '2468')).toBe('ok')
    expect(current()?.name).toBe('Sam')
  })

  it('renames and changes the passcode', async () => {
    await make('student', 'Sam', '2468')
    expect(updateProfile({ name: 'Samir' }).name).toBe('Samir')
    expect(await changePasscode('0000', '1357')).toBe('wrong')
    expect(await changePasscode('2468', '13')).toBe('invalid')
    expect(await changePasscode('2468', '1357')).toBe('ok')
    signOut()
    expect(await signIn('Samir', '2468')).toBe('wrong')
    expect(await signIn('Samir', '1357')).toBe('ok')
  })
})

describe('passwords, the Other role and every picture', () => {
  it('takes a password of 8 or more characters and still takes a 4 to 6 digit passcode', async () => {
    const a = await make('student', 'Sam', 'blue kite 42')
    expect(a.passcodeHash).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(a)).not.toContain('blue kite')
    signOut()
    expect(await signIn('Sam', 'blue kite 4')).toBe('wrong')
    expect(await signIn('Sam', 'blue kite 42')).toBe('ok')
    signOut()
    await make('student', 'Alex', '1357')
    signOut()
    expect(await signIn('Alex', '1357')).toBe('ok')
  })

  it('refuses 7 characters, 7 digits, short letters and anything over 128', async () => {
    for (const p of ['abcdefg', '1234567', 'abcd', 'x'.repeat(129), '']) {
      expect((await createAccount({ role: 'student', name: 'Sam', passcode: p })).reason, p).toBe('passcode')
    }
    expect(current()).toBeNull()
  })

  it('changes a passcode to a password and refuses a short one', async () => {
    await make('student', 'Sam', '2468')
    expect(await changePasscode('2468', 'short')).toBe('invalid')
    expect(await changePasscode('0000', 'a longer one')).toBe('wrong')
    expect(await changePasscode('2468', 'a longer one')).toBe('ok')
    signOut()
    expect(await signIn('Sam', '2468')).toBe('wrong')
    expect(await signIn('Sam', 'a longer one')).toBe('ok')
  })

  it('makes an Other account that needs an email, lands on the launcher and never links', async () => {
    expect(ROLES).toContain('other')
    expect(homeFor('other')).toBe('app')
    expect(homeFor('parent')).toBe('app-parent')
    expect((await createAccount({ role: 'other', name: 'Robin', passcode: '1234' })).reason).toBe('email')
    const parent = await make('parent', 'Dana')
    const inv = createInvite()
    signOut()
    const other = await make('other', 'Robin', 'a fine password', { email: 'robin@example.com' })
    expect(other.role).toBe('other')
    expect(redeemInvite(inv.code).reason).toBe('role')
    /* Only a parent or a professional makes a network. */
    expect(createInvite()).toBeNull()
    expect(listNetwork(other.id)).toHaveLength(0)
    expect(listNetwork(parent.id)).toHaveLength(0)
  })

  it('keeps any picture on the full list, over a hundred, and refuses others', async () => {
    expect(AVATAR_ALL_IDS.length).toBeGreaterThanOrEqual(100)
    expect(new Set(AVATAR_ALL_IDS).size).toBe(AVATAR_ALL_IDS.length)
    for (const id of AVATAR_IDS) expect(AVATAR_ALL_IDS).toContain(id)
    const a = await make('student', 'Sam', '2468', { avatar: 'pat-dots-dusk' })
    expect(a.avatar).toBe('pat-dots-dusk')
    expect(updateProfile({ avatar: 'face-grin' }).avatar).toBe('face-grin')
    expect(updateProfile({ avatar: 'face-nope' }).avatar).toBe('face-grin')
  })
})

describe('invites and links', () => {
  it('makes a six character code with no ambiguous glyphs', async () => {
    await make('parent', 'Dana')
    const inv = createInvite()
    expect(inv.code).toMatch(CODE)
    expect(inv.fromId).toBe(current().id)
    expect(inv.role).toBe('parent')
    expect(new Date(inv.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('links a parent and a student when the student enters the parent code', async () => {
    const { parent, student } = await family()
    const mine = listNetwork(student.id)
    expect(mine).toHaveLength(1)
    expect(mine[0].person.id).toBe(parent.id)
    expect(mine[0].person.role).toBe('parent')
    expect(mine[0].kind).toBe('parent-student')
    expect(mine[0].status).toBe('active')
    const theirs = listNetwork(parent.id)
    expect(theirs).toHaveLength(1)
    expect(theirs[0].person.id).toBe(student.id)
    expect(theirs[0].person.role).toBe('student')
  })

  it('never lets a teen make an invite: only parents and professionals make networks', async () => {
    await make('student', 'Sam')
    expect(createInvite()).toBeNull()
  })

  it('keeps one parent code working for every teen it is sent to', async () => {
    const parent = await make('parent', 'Dana')
    const inv = createInvite()
    signOut()
    const sam = await make('student', 'Sam', '2468')
    expect(redeemInvite(inv.code).link.status).toBe('active')
    /* The same teen twice is already linked. */
    expect(redeemInvite(inv.code).reason).toBe('exists')
    signOut()
    const alex = await make('student', 'Alex', '1357')
    const r = redeemInvite(inv.code)
    expect(r.ok).toBe(true)
    expect(r.link).toMatchObject({ kind: 'parent-student', parent: parent.id, student: alex.id, status: 'active' })
    expect(listNetwork(parent.id).map(l => l.person.id).sort()).toEqual([sam.id, alex.id].sort())
  })

  it('keeps one professional code working for many students, each waiting on their own parent', async () => {
    await make('pro', 'Dr Lee', '975310')
    const inv = createInvite()
    signOut()
    await make('student', 'Sam', '2468')
    expect(redeemInvite(inv.code).link.status).toBe('pending')
    signOut()
    await make('student', 'Alex', '1357')
    expect(redeemInvite(inv.code).link.status).toBe('pending')
  })

  it('leaves a pro link pending until a parent approves it', async () => {
    const { parent, student, pro } = await family()
    await signIn('Dr Lee', '975310')
    const inv = createInvite()
    expect(inv.role).toBe('pro')
    signOut()
    await signIn('Sam', '2468')
    const r = redeemInvite(inv.code)
    expect(r.ok).toBe(true)
    expect(r.link.status).toBe('pending')
    expect(r.link.kind).toBe('pro-student')
    expect(r.link.needsApprovalFrom).toBe('parent')
    expect(r.link.invitedBy).toBe(pro.id)
    /* The same student again is already linked. */
    expect(redeemInvite(inv.code).reason).toBe('exists')
    signOut()
    await signIn('Dana', '1234')
    const pending = listPendingApprovals(parent.id)
    expect(pending).toHaveLength(1)
    expect(pending[0].person.id).toBe(pro.id)
    expect(approveLink(pending[0].id)).toBe('ok')
    const link = listNetwork(student.id).find(l => l.person.id === pro.id)
    expect(link.status).toBe('active')
    expect(link.needsApprovalFrom).toBeNull()
    expect(listPendingApprovals(parent.id)).toHaveLength(0)
  })

  it('lets a parent decline a pro link', async () => {
    const { student, pro } = await family()
    await signIn('Dr Lee', '975310')
    const inv = createInvite()
    signOut()
    await signIn('Sam', '2468')
    const { link } = redeemInvite(inv.code)
    signOut()
    await signIn('Dana', '1234')
    expect(declineLink(link.id)).toBe('ok')
    const after = listNetwork(student.id).find(l => l.person.id === pro.id)
    expect(after.status).toBe('declined')
  })

  it('refuses approval from anyone without an active parent link to the student', async () => {
    const { student } = await family()
    await signIn('Dr Lee', '975310')
    const inv = createInvite()
    signOut()
    await signIn('Sam', '2468')
    const { link } = redeemInvite(inv.code)
    /* The student cannot approve their own pro link. */
    expect(approveLink(link.id)).toBe('forbidden')
    signOut()
    /* Nor can a parent who is not linked to this student. */
    await make('parent', 'Robin', '4321', { email: 'robin@example.com' })
    expect(approveLink(link.id)).toBe('forbidden')
    expect(declineLink(link.id)).toBe('forbidden')
    signOut()
    /* Nor can the pro who sent it. */
    await signIn('Dr Lee', '975310')
    expect(approveLink(link.id)).toBe('forbidden')
    expect(listNetwork(student.id).find(l => l.id === link.id).status).toBe('pending')
  })

  it('refuses an unknown, expired or own code', async () => {
    await make('parent', 'Dana')
    const inv = createInvite()
    expect(redeemInvite('ZZZZZZ').ok).toBe(false)
    expect(redeemInvite(inv.code).reason).toBe('own')
    signOut()
    await make('student', 'Sam')
    const r = redeemInvite(inv.code, new Date(Date.parse(inv.expiresAt) + 1000))
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('expired')
  })

  it('links a parent and a professional, active on redeem, either way round', async () => {
    const { parent, pro } = await family()
    await signIn('Dr Lee', '975310')
    const inv = createInvite()
    signOut()
    await signIn('Dana', '1234')
    const r = redeemInvite(inv.code)
    expect(r.ok).toBe(true)
    expect(r.link.kind).toBe('parent-pro')
    expect(r.link.status).toBe('active')
    expect(r.link.needsApprovalFrom).toBeNull()
    expect(r.link.parent).toBe(parent.id)
    expect(r.link.pro).toBe(pro.id)
    expect(r.link.student).toBeNull()
    expect(listNetwork(parent.id).map(l => l.person.role).sort()).toEqual(['pro', 'student'])
    expect(listNetwork(pro.id)[0].person.id).toBe(parent.id)
    /* The other way round: a second professional redeems the parent's code. */
    const inv2 = createInvite()
    signOut()
    await make('pro', 'Ms Ortiz', '2222', { email: 'ortiz@example.com' })
    const r2 = redeemInvite(inv2.code)
    expect(r2.ok).toBe(true)
    expect(r2.link.kind).toBe('parent-pro')
    expect(r2.link.status).toBe('active')
    /* A parent to professional link is nobody's approval to give. */
    expect(listPendingApprovals(parent.id)).toHaveLength(0)
  })

  it('refuses a link between two of any role', async () => {
    await make('parent', 'Dana')
    const pinv = createInvite()
    signOut()
    await make('parent', 'Robin', '4321', { email: 'robin@example.com' })
    expect(redeemInvite(pinv.code).reason).toBe('role')
    signOut()
    await make('pro', 'Dr Lee', '975310')
    const dinv = createInvite()
    signOut()
    await make('pro', 'Ms Ortiz', '2222', { email: 'ortiz@example.com' })
    expect(redeemInvite(dinv.code).reason).toBe('role')
  })

  it('lets a student remove a link', async () => {
    const { student, parent } = await family()
    await signIn('Sam', '2468')
    const link = listNetwork(student.id)[0]
    expect(removeLink(link.id)).toBe('ok')
    expect(listNetwork(student.id)).toHaveLength(0)
    expect(listNetwork(parent.id)).toHaveLength(0)
  })
})

describe('your data', () => {
  it('deletes an account with its links and invites', async () => {
    const { student, parent } = await family()
    await signIn('Sam', '2468')
    expect(listNetwork(parent.id)).toHaveLength(1)
    deleteAccount()
    expect(current()).toBeNull()
    expect(await signIn('Sam', '2468')).toBe('wrong')
    expect(listNetwork(parent.id)).toHaveLength(0)
    expect(listNetwork(student.id)).toHaveLength(0)
    /* The parent's export carries nothing of the deleted student. */
    await signIn('Dana', '1234')
    const out = JSON.parse(exportAll())
    expect(out.links).toHaveLength(0)
    expect(JSON.stringify(out)).not.toContain(student.id)
  })

  it('exports everything for the signed in account and nothing secret', async () => {
    const { student, parent } = await family()
    await signIn('Sam', '2468')
    const out = JSON.parse(exportAll())
    expect(out.v).toBe(1)
    expect(out.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(out.account).toEqual({
      id: student.id, role: 'student', name: 'Sam', email: null, avatar: null, setting: null,
      createdAt: student.createdAt, lastSignInAt: current().lastSignInAt,
    })
    expect(out.links).toHaveLength(1)
    expect(out.links[0]).toMatchObject({ kind: 'parent-student', student: student.id, parent: parent.id, pro: null, status: 'active' })
    expect(out.links[0].person).toEqual({ id: parent.id, name: 'Dana', role: 'parent', avatar: null })
    /* A teen makes no invites, so there are none to export. */
    expect(out.invites).toHaveLength(0)
    expect(JSON.stringify(out)).not.toMatch(/passcode/i)
  })

  it('wipes every account, link and invite', async () => {
    await family()
    wipe()
    expect(current()).toBeNull()
    expect(await signIn('Dana', '1234')).toBe('wrong')
  })
})
