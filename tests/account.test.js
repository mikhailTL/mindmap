import { beforeEach, describe, expect, it } from 'vitest'
import {
  approveLink, changePasscode, createAccount, createInvite, current, declineLink,
  deleteAccount, exportAll, listNetwork, listPendingApprovals, redeemInvite, removeLink,
  signIn, signOut, updateProfile, wipe,
} from '../src/account/store.js'

/* Accounts, links and invitations are kept on this device. These tests run
   with no window at all, so every localStorage touch has to degrade to the
   in-memory copy, and the whole flow has to be complete without a server:
   a pro invites, a student redeems, a parent approves, all on one device by
   signing in and out in turn. */

async function make(role, name, passcode = '1234') {
  const r = await createAccount({ role, name, passcode })
  expect(r.ok, `${role} ${name}`).toBe(true)
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
    expect(current()?.id).toBe(a.id)
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
    const r = await createAccount({ role: 'parent', name: 'sam', passcode: '1234' })
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

describe('invites and links', () => {
  it('makes a six character code with no ambiguous glyphs', async () => {
    await make('parent', 'Dana')
    const inv = createInvite()
    expect(inv.code).toMatch(/^[A-HJ-KM-NP-Z2-9]{6}$/)
    expect(inv.fromId).toBe(current().id)
    expect(inv.role).toBe('parent')
    expect(inv.forStudentId).toBeNull()
    expect(new Date(inv.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('links a parent and a student when the student enters the parent code', async () => {
    const { parent, student } = await family()
    const mine = listNetwork(student.id)
    expect(mine).toHaveLength(1)
    expect(mine[0].person.id).toBe(parent.id)
    expect(mine[0].role).toBe('parent')
    expect(mine[0].status).toBe('active')
    const theirs = listNetwork(parent.id)
    expect(theirs).toHaveLength(1)
    expect(theirs[0].person.id).toBe(student.id)
  })

  it('links a parent when the parent enters the student code', async () => {
    const student = await make('student', 'Sam')
    const inv = createInvite()
    expect(inv.forStudentId).toBe(student.id)
    signOut()
    await make('parent', 'Dana')
    const r = redeemInvite(inv.code)
    expect(r.ok).toBe(true)
    expect(r.link.status).toBe('active')
    expect(r.link.role).toBe('parent')
    expect(r.link.studentId).toBe(student.id)
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
    expect(r.link.needsApprovalFrom).toBe('parent')
    expect(r.link.invitedBy).toBe(pro.id)
    /* A used code is a used code. */
    expect(redeemInvite(inv.code).ok).toBe(false)
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
    await make('parent', 'Robin', '4321')
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
    createInvite()
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
    const inv = createInvite()
    const out = JSON.parse(exportAll())
    expect(out.v).toBe(1)
    expect(out.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(out.account).toEqual({
      id: student.id, role: 'student', name: 'Sam', createdAt: student.createdAt,
    })
    expect(out.links).toHaveLength(1)
    expect(out.links[0]).toMatchObject({ studentId: student.id, otherId: parent.id, role: 'parent', status: 'active' })
    expect(out.links[0].person).toEqual({ id: parent.id, name: 'Dana', role: 'parent' })
    expect(out.invites).toHaveLength(1)
    expect(out.invites[0].code).toBe(inv.code)
    expect(JSON.stringify(out)).not.toMatch(/passcode/i)
  })

  it('wipes every account, link and invite', async () => {
    await family()
    wipe()
    expect(current()).toBeNull()
    expect(await signIn('Dana', '1234')).toBe('wrong')
  })
})
