# App Store review readiness

For the native iOS app in `ios/`. The aim of this document is a fast first
review, which for this app means removing the three things a reviewer of a
health-adjacent app used by minors reaches for first: an unsupported health
claim, a permission the app does not use, and a screen the reviewer cannot get
past without hardware they do not have.

Every rule below was read from the page cited under it. The App Review
Guidelines page carried **Last Updated: June 8, 2026** when this was written,
so recheck the dated items before each submission.

What the app is, in the words that may be used in review notes, in the
description and on screen:

> MindMap measures physiology and reports patterns. It is not a medical device
> and does not diagnose or treat any condition.

Never: a worn prototype, a clinical trial, a validation study, a diagnosis, an
accuracy figure. No unit has been built or worn.

## Status markers

* **DONE** in the code or the metadata today.
* **OUTSTANDING** has to be built, written or decided before submission.
* **DECISION** a choice with a trade-off, with the recommendation stated.

---

## 1. The shape of the risk

Three facts about this app set the review risk, and they compound:

1. it reports a number derived from physiological signals, which puts it in
   1.4.1 territory;
2. its users are minors, which brings 5.1.4 and the children's privacy
   statutes;
3. it names stress and mental health, which drives the age rating
   questionnaire and invites a reviewer to read the metadata closely.

The mitigation for all three is the same: claim less than the product does,
say plainly what it is not, and make every screen reachable without hardware.

---

## 2. Guideline 1.3, the Kids Category

**What the rule says.** Kids Category apps "must not include links out of the
app, purchasing opportunities, or other distractions to kids unless reserved
for a designated area behind a parental gate." They "may not send personally
identifiable information or device information to third parties" and "should
not include third-party analytics or third-party advertising." And: "once
customers expect your app to follow the Kids Category requirements, it will
need to continue to meet these guidelines in subsequent updates, even if you
decide to deselect the category."
Source: <https://developer.apple.com/app-store/review/guidelines/>

Related, and not optional: **2.3.8** reserves the terms "For Kids" and "For
Children" in the app name, subtitle, icon, screenshots and description to the
Kids Category. An app outside the category "cannot include any terms in app
name, subtitle, icon, screenshots or description that imply the main audience
for the app is children."

**DECISION: do not enter the Kids Category.** Three reasons:

* The Kids Category age bands are 5 and under, 6 to 8, and 9 to 11. MindMap's
  users are 13 to 18. The category would describe the wrong audience.
* The parental gate requirement would sit in front of exactly the links this
  app must keep reachable. A wellness app for teenagers has to be able to
  point at a crisis line and at a privacy policy without a gate in the way.
* The obligation is sticky. It survives deselecting the category, so entering
  it is close to irreversible.

**What MindMap must do instead.**

* Keep the word "teen" out of the name, subtitle and icon. "Teen" is not one
  of the reserved terms, but the safer line is to describe the product rather
  than the audience. **OUTSTANDING: final App Store name and subtitle not yet
  written.**
* Carry the 5.1.4 obligations anyway, because the app is used by minors. See
  section 4.
* Ship no third-party analytics and no third-party advertising. **DONE:** the
  iOS app has no SDK dependencies at all. `ios/Package.swift` declares no
  package dependencies, which is the cheapest way to keep this true.

---

## 3. Guideline 1.4.1, physical harm

**What the rule says.** "Medical apps that could provide inaccurate data or
information, or that could be used for diagnosing or treating patients may be
reviewed with greater scrutiny."

* "Apps must clearly disclose data and methodology to support accuracy claims
  relating to health measurements, and if the level of accuracy or methodology
  cannot be validated, we will reject your app. For example, apps that claim
  to take x-rays, measure blood pressure, body temperature, blood glucose
  levels, or blood oxygen levels using only the sensors on the device are not
  permitted."
* "Apps should remind users to check with a doctor in addition to using the app
  and before making medical decisions."

Source: <https://developer.apple.com/app-store/review/guidelines/>

**Read the first bullet carefully.** It is conditional on making an accuracy
claim. The rejection trigger is a claim that cannot be validated, not the
measurement. Since there is no validation study, the only safe position is to
make no accuracy claim anywhere: not in the description, not in a screenshot,
not on a screen.

**The named prohibition and where MindMap sits against it.** The prohibition
on measuring body temperature "using only the sensors on the device" does not
reach the patch, because the patch is an accessory and not a device sensor.
It does reach the camera and microphone route, which derives a pulse from the
camera alone. Pulse is not one of the four measurements named, but it is the
same shape of claim, so that route must carry no accuracy figure and no
clinical framing.

**The disclaimer pattern that does not trigger rejection.** Three parts, in
this order, and all three are needed:

1. **What it measures, in plain physiology.** "Four signals from the patch:
   heart, sweat, skin temperature and movement."
2. **What it is not.** "MindMap measures physiology and reports patterns. It is
   not a medical device and does not diagnose or treat any condition."
3. **The doctor reminder, which 1.4.1 asks for in its own bullet.** "If
   something worries you, talk to a doctor. MindMap is not a substitute for
   one, and nothing in it should be used to make a medical decision."

Wording to avoid, each of which reads as a medical claim:

| Do not write | Write instead |
| --- | --- |
| detects anxiety, detects depression | reports where today sits against your own normal |
| measures your stress level | measures four signals and reports one number |
| monitors your mental health | reports patterns in four signals |
| clinically validated, clinically proven, accurate to within | nothing. There is no study. |
| FDA, CE, medical grade, diagnostic | nothing |
| treats, therapy, intervention | the toolkit, exercises |
| AI, intelligent, learns about you | a 261-parameter model fitted to a published-coefficient reference model |

The last row is a product rule as well as a review one. The network is 261
parameters fitted against the reference model documented in
`tools/net/train.py`, and it is not fitted to any person's readings. Describe
it that way or not at all.

**Status.**

* **DONE:** `Vocabulary.notAMedicalDevice` holds part 2 verbatim, is rendered
  by the `NotAMedicalDevice` view, and appears on Today, the reading result
  and Sharing. A unit test asserts the wording.
* **OUTSTANDING:** part 3, the doctor reminder, is not a standing line in the
  app. The toolkit's "If you are worried" copy points at a GP, a school
  counsellor and a crisis line, but that is a screen a reader has to go
  looking for. Add the reminder next to the score.
* **OUTSTANDING:** if the camera and microphone route ships, it needs part 1
  stated in terms of what it actually measures, with no accuracy claim.
* **OUTSTANDING:** the App Store description and all screenshots have to be
  checked against the table above. Neither is written yet.
* **DONE:** no regulatory clearance is claimed, so there is nothing to submit
  under the "if your medical app has received regulatory clearance" sentence.
  Do not invent one.

---

## 4. Guidelines 5.1.1 and 5.1.2, and 5.1.4 for minors

### 5.1.1(i) privacy policy

**What the rule says.** "All apps must include a link to their privacy policy
in the App Store Connect metadata field and within the app in an easily
accessible manner." It must identify what data is collected and how, confirm
equal protection by any third party it is shared with, and "explain its data
retention/deletion policies and describe how a user can revoke consent and/or
request deletion of the user's data."

**5.1.4(b)** makes it unconditional here: an app "in the Kids Category or those
that collect, transmit, or have the capability to share personal information
... from a minor must include a privacy policy and must comply with all
applicable children's privacy statutes."
Source: <https://developer.apple.com/app-store/review/guidelines/>

**Status. OUTSTANDING, two parts.**

* There is no privacy policy screen or link in the iOS app. A Settings row
  linking out is enough, and since MindMap is not in the Kids Category it does
  not need a parental gate in front of it.
* The policy itself has to say three things this app can say cleanly: nothing
  is collected because nothing leaves the device; revoking consent is the
  switches on the Sharing screen plus "Turn off everything"; deletion is
  deleting the app, and there is no server copy to request deletion of.

### 5.1.1(ii) permission and purpose strings

**What the rule says.** "Apps that collect user or usage data must secure user
consent for the collection ... Apps must also provide the customer with an
easily accessible and understandable way to withdraw consent. Ensure your
purpose strings clearly and completely describe your use of the data."

**2.5.14** adds, for the camera and microphone specifically: "Apps must request
explicit user consent and provide a clear visual and/or audible indication
when recording, logging, or otherwise making a record of user activity. This
includes any use of the device camera, microphone, screen recordings, or other
user inputs."

**Status.**

* **DONE:** the three purpose strings in `ios/MindMap/App/Info.plist` each name
  the data, the use, and the fact that it stays on the device. That is the
  shape 5.1.1(ii) asks for.
* **DONE:** withdrawing consent is the Sharing screen, which can turn every
  category off per audience and has a "Turn off everything" button.
* **OUTSTANDING, and this one is a likely rejection as the build stands.** The
  camera and microphone purpose strings describe a route the iOS app does not
  yet take: the signal processing in `src/signals/ppg.js` and
  `src/signals/voice.js` has not been ported. Either ship that route or delete
  `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` before
  submitting. A declared permission the app never requests reads as a
  minimisation problem under 5.1.1(iii) and as inaccurate metadata.
* **OUTSTANDING:** if the camera and microphone route ships, 2.5.14 needs a
  visible indicator while it runs. A countdown and a live signal readout on
  screen satisfy it; a silent capture does not.

### 5.1.1(iii) data minimisation

"Apps should only request access to data relevant to the core functionality of
the app and should only collect and use data that is required to accomplish
the relevant task."

* **DONE:** no location, no contacts, no photos, no notifications, no push, no
  App Group, no HealthKit. `LocationFix` exists as a type only to keep the
  rule in the type system, and nothing in the app produces one.
* **DONE:** no background mode is declared. `Info.plist` carries a comment
  saying `bluetooth-central` must not be added until the app actually reads
  the patch in the background, which also keeps it clear of **2.5.4**
  ("Multitasking apps may only use background services for their intended
  purposes").

### 5.1.1(v) account sign-in

**What the rule says.** "If your app doesn't include significant account-based
features, let people use it without a login. If your app supports account
creation, you must also offer account deletion within the app. Apps may not
require users to enter personal information to function, except when directly
relevant to the core functionality of the app or required by law."

* **DONE:** there is no login and no account. The app works on first launch.
  This is the single biggest review-speed advantage the app has, because it
  removes the demo account requirement in 2.1 entirely.
* **OUTSTANDING, future:** the product says a guardian opens the account. The
  moment guardian accounts ship, in-app account deletion becomes mandatory,
  and the questionnaire answers in sections 7 and 8 change. Keep accounts out
  of the first submission if that is at all possible.

### 5.1.2, data use and sharing

**What the rule says.** "Unless otherwise permitted by law, you may not use,
transmit, or share someone's personal data without first obtaining their
permission ... You must clearly disclose where personal data will be shared
with third parties, including with third-party AI, and obtain explicit
permission before doing so." And 5.1.2(ii): "Data collected for one purpose
may not be repurposed without further consent."

* **DONE:** nothing leaves the device. There is no network client in the iOS
  app and `ShareTransport` has no conforming type. `SharePayload` has no
  public initialiser, so the only way to build one is through
  `SharePayloadBuilder`, which requires an active `ConsentGrant`.
* **DONE:** the no-repurposing rule is enforced structurally. A grant names
  categories one at a time, no category implies another, and a parent's grant
  is floored to day granularity by `ConsentGrant.init` whatever it asks for.
* **DONE:** no App Tracking Transparency prompt is needed, because the app
  does not track. See section 7.
* **OUTSTANDING, when sharing actually transmits:** the privacy policy and the
  nutrition label both change, and the receiving service becomes a third party
  under 5.1.1(i) that has to provide equal protection.

---

## 5. Guideline 5.1.3, health and health research

**What the rule says.** "Health, fitness, and medical data are especially
sensitive." Then:

* **(i)** Apps "may not use or disclose to third parties data gathered in the
  health, fitness, and medical research context ... for advertising,
  marketing, or other use-based data mining purposes other than improving
  health management, or for the purpose of health research, and then only with
  permission." And: "You must disclose the specific health data that you are
  collecting from the device."
* **(ii)** "Apps must not write false or inaccurate data into HealthKit or any
  other medical research or health management apps, and may not store personal
  health information in iCloud."
* **(iii)** Research on human subjects "must obtain consent from participants
  or, in the case of minors, their parent or guardian," covering the nature,
  purpose and duration of the research, the procedures, risks and benefits,
  confidentiality and data handling including any third-party sharing, a point
  of contact, and the withdrawal process.
* **(iv)** Such research "must secure approval from an independent ethics
  review board. Proof of such approval must be provided upon request."

**2.5.1** adds that "HealthKit should be used for health and fitness purposes
and integrate with the Health app," and **5.1.2(vi)** that HealthKit data "may
not be used for marketing, advertising or use-based data mining, including by
third parties."
Source: <https://developer.apple.com/app-store/review/guidelines/>

### What MindMap must do

* **DONE:** no advertising, no marketing use, no data mining. There is nothing
  to disclose under (i) because nothing is collected off the device.
* **DECISION: do not adopt HealthKit for the first submission.** The reasons
  are specific, not general caution:
  * 5.1.3(ii) forbids writing false or inaccurate data. The Mind Score is a
    derived number with no validation study behind it, so writing it into
    HealthKit is a rule this app cannot safely stand behind.
  * 2.5.1 requires HealthKit integration to be genuine and to integrate with
    the Health app, which is work with no product benefit today.
  * Adopting it adds a reviewed capability, a new nutrition label answer and
    an iCloud prohibition to honour, in exchange for nothing the app needs.
  * Reading heart data out of HealthKit instead of the patch would also
    undercut the product: the score is defined against the wearer's own
    fourteen-day baseline captured the same way every time.
* **OUTSTANDING, and the sharpest one in this section.** The repo collects a
  anonymous usability survey (`src/survey/`, `tools/survey-endpoint.gs`).
  If any version of the iOS app collects survey responses or readings from
  teenagers for research, 5.1.3(iii) and (iv) both bite: consent covering all
  five listed elements, from a parent or guardian because the participants are
  minors, plus approval from an independent ethics review board, with proof on
  request. Two ways through, and the first is strongly preferred:
  1. keep the survey out of the iOS app. Leave it on the web, where it is
     today, and it is not an App Review matter at all.
  2. if it must be in the app, write the consent to cover the five elements
     and have the review board approval in hand before submitting. For a
     science-fair route the Scientific Review Committee approval is the
     analogue, and the paperwork has to exist before a reviewer asks.
* **OUTSTANDING:** nothing in the app may be described as research on its
  users. "A 261-parameter model fitted to a published-coefficient reference
  model" is a description of a method, not a study, and it must not be dressed
  up as one.

---

## 6. Accessory and MFi considerations for a Bluetooth peripheral

**What the rules say.** There is no guideline in section 2.4 or 2.5 that is
specifically about a Bluetooth Low Energy peripheral. The ones that touch it:

* **2.5.1** "Apps may only use public APIs ... Apps should use APIs and
  frameworks for their intended purposes and indicate that integration in
  their app description."
* **2.4.3** requires an app that needs a game controller to say so in its
  metadata. It is written for Apple TV, but it is the only explicit "required
  peripheral" disclosure in the guidelines and it is the pattern to copy.
* **2.4.2** "Design your app to use power efficiently and be used in a way
  that does not risk damage to the device."
* **3.1.4** allows hardware-specific features to unlock without in-app
  purchase, for example an astronomy app that works with a telescope.
* **2.5.17** requires Apple's framework for Matter pairing. Not applicable:
  the patch is not a Matter accessory.

Source: <https://developer.apple.com/app-store/review/guidelines/>

**MFi.** Apple's MFi Program page describes the program as covering accessories
that "communicate with Apple devices using MFi technologies and components"
and names HomeKit, AirPlay audio, Find My and CarPlay with car keys. It does
not mention Bluetooth Low Energy or GATT.
Source: <https://mfi.apple.com/>

**Assessment.** A peripheral that advertises a GATT service and is read with
CoreBluetooth, which is what the MindMap patch does, is not using an MFi
technology and does not appear to need MFi licensing. Apple does not publish a
clean statement to that effect, and the developer forum discussion on the
question is unanswered by Apple staff, so this is a reasoned reading and not a
quotation.
**OUTSTANDING: confirm with Apple Developer Support before relying on it, and
confirm again if the firmware ever adopts Find My, AirPlay or HomeKit.**

**What MindMap must do.**

* **OUTSTANDING:** say in the App Store description that the patch is optional
  hardware and that the app works without it. This is the 2.4.3 pattern, it is
  honest, and it is what stops a reviewer treating the pairing screen as a
  dead end.
* **DONE:** every UUID is in one file, `PatchIdentifiers.swift`, marked as a
  placeholder, with the three steps to replace them when the firmware is
  final. A reviewer never sees this, but a submission with a stale UUID is a
  2.1 rejection for a non-functional feature.
* **DONE:** no background mode, so the app cannot drain a battery while
  backgrounded, which is the 2.4.2 exposure for a BLE app.
* **DONE:** pairing failure is a sentence and a way out, not a dead end. Every
  `PatchManager.Status` has plain-language copy and the reading screen keeps
  the other two routes reachable.
* **DECISION, worth evaluating later:** `AccessorySetupKit`, available from iOS
  18, can "discover, select, and set up a specific Bluetooth accessory without
  requesting permission to use Bluetooth." That would remove the Bluetooth
  permission prompt and the purpose string with it, which is a real privacy
  improvement for an app used by minors. It is not needed for a first
  submission and it changes the pairing flow, so it is a second-version
  change.
  Source: <https://developer.apple.com/documentation/accessorysetupkit>

**Do not claim any hardware fact that is not settled.** The settled facts, and
the only ones that may appear in metadata: 54 mm by 36 mm oval, worn on the
outer upper arm with the long axis parallel to the arm, four channels at 1 Hz,
Bluetooth Low Energy, charging through a slot in the side of the shell. Not
settled and therefore not stated anywhere: battery life, adhesive lifetime,
electrode material, part numbers, water resistance, weight, cost.

---

## 7. Privacy nutrition label, field by field

**What the rule says.** Apple's definitions, both quoted from
<https://developer.apple.com/app-store/app-privacy-details/>:

> "Collect" refers to transmitting data off the device in a way that allows you
> and/or your third-party partners to access it for a period longer than what
> is necessary to service the transmitted request in real time.

> "Tracking" refers to linking data collected from your app about a particular
> end-user or device, such as a user ID, device ID, or profile, with
> Third-Party Data for targeted advertising or advertising measurement
> purposes, or sharing data collected from your app about a particular
> end-user or device with a data broker.

And the sentence that decides this whole section for MindMap:

> Data that is processed only on device is not "collected" and does not need to
> be disclosed in your answers. If you derive anything from that data and send
> it off device, the resulting data should be considered separately.

**The answer for the build in `ios/` today: Data Not Collected, every field.**
Nothing is transmitted off the device. There is no network client, no
analytics, no crash reporting SDK, and `ShareTransport` has no conforming
type.

Field by field, with what the app holds and why it is still not collected:

| Apple data type | What MindMap holds on the device | Declare today | What would change it |
| --- | --- | --- | --- |
| Health and Fitness > Health | the four signals, the Mind Score, the baseline, the six answers | No | any transmission, including a share that posts to a server |
| Health and Fitness > Fitness | nothing. Motion and Fitness APIs are not used | No | adding the accelerometer route for the camera capture |
| Contact Info > Name, Email, Phone, Address | nothing. There is no account | No | guardian accounts |
| Sensitive Info | nothing. The app asks nothing about race, orientation, religion, disability or politics | No | would be a product change, not a metadata one |
| Location > Precise or Coarse | nothing. Location is never requested | No | would require a new purpose string, and `LocationFix` would need a `Shareable` conformance that deliberately does not exist |
| Contacts | nothing | No | sharing by invitation |
| User Content > Audio Data | nothing. The microphone is never recorded. `MicrophoneSession` holds a start time and a duration and no samples | No | storing or transmitting audio, which the product forbids |
| User Content > Photos or Videos | nothing. The camera route, when it ships, reads frames and keeps none | No | saving a frame |
| User Content > Other User Content | journal notes, on the device only | No | any export that includes a note, which `JournalNote` cannot be put in a payload to allow |
| Identifiers > User ID | nothing | No | accounts |
| Identifiers > Device ID | nothing. The IDFA is never requested | No | any advertising SDK, which must not be added |
| Usage Data > Product Interaction | nothing. There is no analytics | No | adding analytics of any kind |
| Diagnostics > Crash Data, Performance Data | nothing. No crash reporter | No | adding one. Note that Apple's own Xcode crash reports do not count as collection by the app |
| Purchases, Financial Info, Browsing History, Search History, Surroundings, Body | nothing | No | n/a |

**Tracking: No.** Nothing is linked with third-party data and nothing goes to a
data broker, so no App Tracking Transparency prompt is required.

**Status.**

* **DONE** as a factual matter for the code in `ios/`.
* **OUTSTANDING:** the answers still have to be entered in App Store Connect,
  and the privacy policy has to agree with them word for word. A policy that
  describes collection the label denies is a 5.1.1(i) problem.
* **OUTSTANDING, the trigger to watch.** The first line of code that posts a
  `SharePayload` anywhere turns the first row of that table into "Health,
  linked to the user, for App Functionality," and brings the whole of 5.1.3
  with it. Decide that deliberately, not as a side effect of a feature.

---

## 8. Age rating questionnaire, answered

Apple's current tiers are 4+, 9+, 13+, 16+ and 18+. The 13+, 16+ and 18+ tiers
were introduced in 2025, so a rating carried over from an older submission is
not comparable. Two definitions decide this app's rating, both quoted from
<https://developer.apple.com/help/app-store-connect/reference/age-ratings/>:

> **Medical or Treatment Information:** Content that provides diagnoses or
> guidance around the management of medical conditions or health and wellness.
> May include: medication guidance, emergency medical care, or treatment
> information.

> **Mature or Suggestive Themes:** Content that implies or indirectly
> references sexual or mature topics without being explicit or topics for
> older audiences due to the complex, intense, or sensitive nature, which may
> deal with real-world issues or content unsuitable for children. May include:
> ... psychological trauma or abuse ...

And the tier that the answers have to stay below:

> **16+:** Apps with this rating may contain instances of the following content
> that may not be suitable for children under the age of 16: ... **Medical or
> Wellness:** Frequent medical or treatment information. **Sexuality or
> Nudity:** Frequent mature or suggestive themes.

### The answers

| Category | Descriptor | Answer | Why |
| --- | --- | --- | --- |
| In-App Controls | Parental Controls | None | there is no account and no parental control surface in this build. Becomes present when guardian accounts ship |
| In-App Controls | Age Assurance | None | the Declared Age Range API is not adopted. See below |
| Capabilities | Unrestricted Web Access | None | no web view. A privacy policy link opens Safari and is a single fixed destination, not unrestricted access |
| Capabilities | User-Generated Content | None | notes are written by the student and never shown to anybody else. `JournalNote` has no `Shareable` conformance, so there is no path by which one becomes visible to another person |
| Capabilities | Social Media | None | **this is the answer that must stay None.** Social media is a 13+ trigger on its own |
| Capabilities | Social Media Disabled for Users Under 13 | n/a | no social media |
| Capabilities | Messaging and Chat | None | there is no messaging anywhere in the app |
| Capabilities | Advertising | None | no ads, ever |
| Mature Themes | Profanity or Crude Humor | None | |
| Mature Themes | Horror/Fear Themes | None | |
| Mature Themes | Alcohol, Tobacco, or Drug Use or References | None | |
| Medical or Wellness | Medical or Treatment Information | **Infrequent** | see the reasoning below. Not None, and not Frequent |
| Medical or Wellness | Health or Wellness Topics | **Yes, present** | the whole product is a wellness topic. This descriptor appears from 9+ |
| Sexuality or Nudity | Mature or Suggestive Themes | **None** | see the reasoning below |
| Sexuality or Nudity | Sexual Content or Nudity | None | |
| Sexuality or Nudity | Graphic Sexual Content and Nudity | None | |
| Violence | all four descriptors | None | |
| Chance-Based Activities | all four descriptors | None | no gambling, no contests, no loot boxes |

**Expected result: 9+.**

### The two answers worth arguing about

**Medical or Treatment Information: Infrequent, not None.** Apple's definition
covers "guidance around the management of ... health and wellness," not only
diagnosis and medication. The toolkit gives coping guidance, and the "If you
are worried" copy points at a GP, a school counsellor and a crisis line, which
is inside "emergency medical care." Answering None would be wrong on the face
of the definition, and a wrong questionnaire answer is grounds for a rating
change after release, which is slower and more public than getting it right
now. Answering Frequent would push the app to 16+, which is the wrong audience
for a teen wellness product. Infrequent is both the honest answer and the
right one.

**Mature or Suggestive Themes: None, and keep it that way.** The definition
reaches "psychological trauma or abuse." MindMap must not go there. It reports
patterns in four signals and offers a toolkit; it does not discuss trauma,
abuse, self-harm or suicide. The crisis-line pointer is a single sentence
saying that an emergency is not an app's job, which is a signpost rather than
content about the subject. **OUTSTANDING: review the final toolkit and parent
copy against this definition before submitting.** Adding content about trauma
would move the app toward 16+ and change this answer.

### Age assurance, worth deciding now

Apple ships a Declared Age Range API: "Use the Declared Age Range API to
request that people share their age range with your app. For children in a
Family Sharing group, a parent or guardian or the Family Organizer can decide
whether to always share a child's age information with your app, ask the child
every time, or never share their age information." It needs the
`com.apple.developer.declared-age-range` entitlement. Apple is explicit about
where the responsibility sits: "You are solely responsible for ensuring
compliance with associated laws or regulations that may apply to your app."
Source: <https://developer.apple.com/documentation/declaredagerange>

**DECISION: not in the first submission, and revisit before any guardian
account ships.** It is the right tool for a guardian consent flow, which is
what the product describes, and several jurisdictions are moving toward
requiring an age signal for apps used by minors. It is unnecessary while the
app has no account and collects nothing, and adopting it would change the Age
Assurance answer above.

---

## 9. Guideline 2.1, app completeness, demo mode and review notes

**What the rule says.** Submissions "should be final versions with all
necessary metadata and fully functional URLs included; placeholder text, empty
websites, and other temporary content should be scrubbed before submission ...
include demo account info (and turn on your back-end service!) if your app
includes a login. If you are unable to provide a demo account due to legal or
security obligations, you may include a built-in demo mode in lieu of a demo
account with prior approval by Apple. Ensure the demo mode exhibits your app's
full features and functionality."

Apple's "Before You Submit" guidance adds: "Provide App Review with full access
to your app ... plus any other hardware or resources that might be needed to
review your app," and "Include detailed explanations of non-obvious features
and in-app purchases in the App Review notes, including supporting
documentation where appropriate."
Source: <https://developer.apple.com/app-store/review/guidelines/>

**This is the single highest-leverage item for a fast review.** A reviewer with
no patch must be able to reach every screen. They can.

* **DONE:** no login, so no demo account is needed and the "prior approval by
  Apple" sentence does not apply. That sentence is about demo mode replacing a
  demo account for a login-gated app.
* **DONE:** the reading screen offers a "Demo patch" that generates a 1 Hz
  four-channel stream on the phone and a "Fill in a fortnight of demo
  readings" button that populates Today, the recent readings list and Sharing.
  The demo stream is encoded and decoded through the same `PatchFrame` the
  radio path uses, so it exercises the real decode rather than going around
  it.
* **DONE:** the demo data is labelled as simulated on screen and in the source,
  and is generated on the device rather than recorded from anybody.
* **OUTSTANDING:** the review notes are not written. A draft to adapt:

> MindMap works with an optional upper-arm patch that sends four signals over
> Bluetooth Low Energy. You do not need the patch to review the app, and no
> account or login is required.
>
> To see the whole app without hardware:
> 1. Open the Reading tab.
> 2. Under "Without a patch to hand", tap "Fill in a fortnight of demo
>    readings". The Today and Sharing tabs then have data in them.
> 3. Tap "Demo patch" to watch a thirty second reading run and produce a score.
>    The stream is generated on the device and is labelled as simulated on
>    screen. It is not recorded from a person.
> 4. "Answer six questions" is a second route that needs no hardware and no
>    camera.
>
> What the app is: it measures physiology and reports one number a day against
> the wearer's own baseline, with one plain sentence about it. It is not a
> medical device, it does not diagnose or treat any condition, and it makes no
> accuracy claim. The number comes from a 261-parameter model fitted to a
> published-coefficient reference model, not from any model trained on users.
>
> Privacy: the app makes no network requests. There is no account, no
> analytics and no advertising. Everything is computed and stored on the
> device. The Sharing tab shows what a parent or a medical professional would
> be sent if the student switched a category on; a parent can never be shown
> anything finer-grained than one day, and notes are never shareable with
> anybody.
>
> Bluetooth: the Bluetooth permission is used only to read the patch. If you
> tap "Use the patch" with no patch nearby, the app says so in plain words and
> leaves the other two routes available.

* **OUTSTANDING:** no placeholder text anywhere in the submitted build. Two
  known ones to resolve: the bundle identifier `com.solaceinnovation.mindmap`
  has to be registered on an Apple Developer account, and the patch UUIDs in
  `PatchIdentifiers.swift` are the Nordic UART Service standing in for
  firmware UUIDs that do not exist yet. A submission whose pairing cannot work
  is an incomplete app under 2.1.
* **OUTSTANDING:** the support URL and marketing URL have to resolve. 2.1(a)
  names empty websites and non-functional URLs explicitly.

---

## 10. What changed recently, and what to recheck

* **App Review Guidelines last updated June 8, 2026.** Recheck 1.4.1, 5.1.1,
  5.1.3 and 2.5.14 against the live page before each submission.
  <https://developer.apple.com/app-store/review/guidelines/>
* **5.1.2(i) now names third-party AI explicitly**: "You must clearly disclose
  where personal data will be shared with third parties, including with
  third-party AI, and obtain explicit permission before doing so." MindMap
  shares nothing with anybody, which keeps it clear, but any future
  server-side processing of a reading would land squarely in this sentence.
* **Age ratings were overhauled in 2025**, adding 13+, 16+ and 18+ to 4+ and
  9+, with the questionnaire reorganised into In-App Controls, Capabilities,
  Mature Themes, Medical or Wellness, Sexuality or Nudity, Violence and
  Chance-Based Activities. Answers from an older questionnaire do not map
  across.
  <https://developer.apple.com/help/app-store-connect/reference/age-ratings/>
* **Declared Age Range is new**, and age-signal requirements for apps used by
  minors are moving in several jurisdictions. Watch it rather than adopt it.
  <https://developer.apple.com/documentation/declaredagerange>
* **AccessorySetupKit, iOS 18 and later**, can pair a named Bluetooth accessory
  without the Bluetooth permission prompt.
  <https://developer.apple.com/documentation/accessorysetupkit>

---

## 11. Outstanding, in the order that blocks a submission

Blocking:

1. Delete `NSCameraUsageDescription` and `NSMicrophoneUsageDescription`, or
   ship the camera and microphone route. Do not submit with purpose strings
   for a route the app does not take.
2. Register the bundle identifier `com.solaceinnovation.mindmap`.
3. Replace the placeholder patch UUIDs with the firmware's, or do not present
   patch pairing as a working feature in this submission.
4. Write the privacy policy, host it, link it in App Store Connect and add a
   link inside the app.
5. Write the App Review notes. The draft in section 9 is a starting point.
6. Enter the privacy answers in App Store Connect as Data Not Collected across
   the board, and make sure the policy says the same thing.
7. Answer the age rating questionnaire as set out in section 8.
8. Write the App Store name, subtitle, description and screenshots, and check
   every line against the claim table in section 3. No accuracy claim, no
   diagnosis language, no worn unit in any screenshot, nothing labelled as
   intelligence it does not have.
9. Make the support URL and marketing URL resolve.

Not blocking, but do them:

10. Add the standing doctor reminder next to the score, which 1.4.1 asks for in
    its own bullet.
11. Say in the description that the patch is optional and the app works without
    it.
12. Confirm with Apple Developer Support that a plain GATT peripheral read with
    CoreBluetooth needs no MFi licence.
13. Review the final toolkit and parent copy against Apple's "Mature or
    Suggestive Themes" definition, so the Sexuality or Nudity answers stay
    None.
14. Decide, on the record, that the usability survey stays out of the iOS app.
    If it does not, 5.1.3(iii) and (iv) require guardian consent covering five
    specified elements and independent ethics review board approval, with
    proof on request.

Deliberately not doing, and the reason:

15. No Kids Category. Wrong age band, and the parental gate would sit in front
    of the links a wellness app has to keep reachable.
16. No HealthKit. 5.1.3(ii) forbids writing inaccurate data and there is no
    validation study behind the Mind Score.
17. No background Bluetooth mode. The app does not read the patch in the
    background.
18. No analytics, no crash SDK, no advertising identifier. Each one would turn
    a clean nutrition label into a declared collection.
19. No account in the first submission. No login means no demo account, which
    is the fastest shape a review can have.

---

## Sources

* App Store Review Guidelines, last updated June 8, 2026:
  <https://developer.apple.com/app-store/review/guidelines/>
  (1.3, 1.4.1, 2.1, 2.3.8, 2.4.2, 2.4.3, 2.5.1, 2.5.4, 2.5.14, 2.5.17, 3.1.4,
  5.1.1, 5.1.2, 5.1.3, 5.1.4)
* App privacy details on the App Store, including the definitions of "Collect"
  and "Tracking" and the on-device processing carve-out:
  <https://developer.apple.com/app-store/app-privacy-details/>
* Age ratings reference, including the current tiers and the descriptor
  definitions: <https://developer.apple.com/help/app-store-connect/reference/age-ratings/>
* Declared Age Range framework:
  <https://developer.apple.com/documentation/declaredagerange>
* AccessorySetupKit framework:
  <https://developer.apple.com/documentation/accessorysetupkit>
* MFi Program: <https://mfi.apple.com/>
