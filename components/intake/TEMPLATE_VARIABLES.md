# Nashville ClearBra — Google Docs Template Variables

> **Source:** `lib/pdf-replacements.ts`
>
> Use `{{var}}` placeholders in your Google Doc. Checkbox vars output `☑` or `☐`.
>
> **Image placeholders** use Alt-text title matching. Set the image's Alt-text title to the key name.

---

## Work Order Header

| Variable | Description |
|---|---|
| `{{ro}}` | RO Number |
| `{{dropOffDate}}` | Drop-off date |
| `{{completionDate}}` | Completion date |
| `{{ig}}` | Instagram handle |
| `{{tiktok}}` | TikTok handle |
| `{{howHeard}}` | Lead source |
| `{{xpelReferral}}` | XPEL Referral |

## Client

| Variable | Description |
|---|---|
| `{{clientName}}` | Full name |
| `{{clientPhone}}` | Phone |
| `{{clientEmail}}` | Email |

## Vehicle

| Variable | Description |
|---|---|
| `{{vYear}}` | Year |
| `{{vMake}}` | Make |
| `{{vModel}}` | Model |
| `{{vSubmodel}}` | Submodel |
| `{{vTrim}}` | Trim |
| `{{vColor}}` | Color |
| `{{vPlate}}` | Plate |
| `{{vin}}` | VIN |
| `{{mileage}}` | Mileage |

## Staff

| Variable | Description |
|---|---|
| `{{intakeStaff}}` | Intake staff |
| `{{installer}}` | Installer |
| `{{ist}}` | IST |

---

## Services Checkboxes

| Variable | Label |
|---|---|
| `{{c_ppf}}` | Paint Protection Film (PPF) |
| `{{c_tnt}}` | Window Tint |
| `{{c_wpf}}` | Windshield Protection Film |
| `{{c_cer}}` | Ceramic Coating |
| `{{c_add}}` | Add-Ons |

---

## PPF — Text Fields

| Variable | Description |
|---|---|
| `{{ppfFilm}}` | Film type name |
| `{{ppfLevel}}` | STD / EXT |
| `{{ppfColor}}` | Color / Supplier |
| `{{ppfPackages}}` | Package list (comma) |
| `{{ppfNotes}}` | Individual Panels / Notes |
| `{{ppfPrice}}` | Total price |

## PPF — Film Type Checkboxes

| Variable | Label |
|---|---|
| `{{c_up}}` | Ultimate Plus |
| `{{c_uf}}` | Ultimate Fusion |
| `{{c_st}}` | Stealth |
| `{{c_cp}}` | Color PPF |

## PPF — Install Level

| Variable | Label |
|---|---|
| `{{c_std}}` | STD |
| `{{c_ext}}` | EXT |

## PPF — Package / Coverage

| Variable | Label |
|---|---|
| `{{c_fc}}` | Full Coverage |
| `{{c_ff}}` | Full Front |
| `{{c_ffr}}` | Full Front + Rockers |
| `{{c_tp}}` | Track Pack |
| `{{c_pf}}` | Partial Front |
| `{{c_wt}}` | Wear and Tear |
| `{{c_hf}}` | Hood Full |
| `{{c_hp}}` | Hood Partial |
| `{{c_ad}}` | All Doors |
| `{{c_sd}}` | Single Door |
| `{{c_rk}}` | Rockers |
| `{{c_dc}}` | Door Cups / Edges |
| `{{c_hl}}` | Headlights |
| `{{c_fl}}` | Fog Lights |
| `{{c_tl}}` | Taillights |
| `{{c_mc}}` | Mirror Caps |
| `{{c_pl}}` | A/B/C/D Pillars |
| `{{c_rf}}` | Roof |
| `{{c_sp}}` | Spoiler |
| `{{c_la}}` | Luggage Area |
| `{{c_ic}}` | Interior Console |
| `{{c_it}}` | Interior Trim |

---

## Window Tint

| Variable | Description |
|---|---|
| `{{tintFilmSeries}}` | Film series |
| `{{tintTotal}}` | Total tint price |

### Tint Rows (1–8)

| Pattern | Description |
|---|---|
| `{{tintRow1_series}}` | Series |
| `{{tintRow1_shade}}` | Shade % |
| `{{tintRow1_position}}` | Position |
| `{{tintRow1_price}}` | Price |

> Same pattern for rows 2–8: `{{tintRow2_series}}`, etc.

---

## Ceramic Coating

| Variable | Description |
|---|---|
| `{{ceramicType}}` | Product type |
| `{{ceramicSurfaces}}` | Surfaces (comma) |
| `{{ceramicSurfacePrice}}` | Per-surface price |
| `{{ceramicTotal}}` | Total price |

## WPF

| Variable | Description |
|---|---|
| `{{wpfEnabled}}` | Enabled |
| `{{wpfPrice}}` | Price |

## Add-Ons

| Variable | Description |
|---|---|
| `{{screenType}}` | Screen protector type |
| `{{screenPrice}}` | Screen price |
| `{{lightFilm}}` | Light film type |
| `{{lightFront}}` | Front shade |
| `{{lightRear}}` | Rear shade |
| `{{lightPrice}}` | Light price |
| `{{emblemColor}}` | Emblem color |
| `{{emblemFinish}}` | Emblem finish |
| `{{removePanels}}` | Panels to remove |
| `{{removePpf}}` | PPF removal |
| `{{removePrice}}` | Removal price |
| `{{addonsTotal}}` | Total add-ons |

---

## Job Instructions

| Variable | Description |
|---|---|
| `{{addRequests}}` | Special instructions |

## Pricing & Terms

| Variable | Description |
|---|---|
| `{{deposit}}` | Deposit amount |
| `{{liabilityInitials}}` | Liability initials |
| `{{refSource}}` | Referral source |
| `{{refDetails}}` | Referral details |
| `{{refXpel}}` | XPEL referral |
| `{{xpelReferred}}` | XPEL referred by |

---

## Known Damage

| Variable | Description |
|---|---|
| `{{damageNotes}}` | Damage notes |
| `{{damageInitials}}` | Confirmation initials |
| `{{bodyStyle}}` | sedan / suv |
| `{{damageCount}}` | Number of pins |
| `{{damageDiagramUrl}}` | Diagram image URL |

### Image Placeholder

| Alt-text Title | Description |
|---|---|
| `damage_diagram` | Replaced with diagram PNG |

## Signature

| Variable | Description |
|---|---|
| `{{sigName}}` | Printed name |
| `{{sigDate}}` | Date |

## Computed

| Variable | Description |
|---|---|
| `{{totalPrice}}` | Grand total |
| `{{submittedAt}}` | Submission time |

---

## Google Docs Template Layout Example (PPF Box)

```
FILM TYPE
{{c_up}} Ultimate Plus   {{c_uf}} Ultimate Fusion
{{c_st}} Stealth         {{c_cp}} Color PPF
Color / Supplier: {{ppfColor}}

STD {{c_std}}    EXT {{c_ext}}

PACKAGE / COVERAGE
{{c_fc}} Full Coverage    {{c_ff}} Full Front
{{c_ffr}} Full Front + Rockers  {{c_tp}} Track Pack
{{c_pf}} Partial Front    {{c_wt}} Wear and Tear
{{c_hf}} Hood Full        {{c_hp}} Hood Partial
{{c_ad}} All Doors        {{c_sd}} Single Door
{{c_rk}} Rockers          {{c_dc}} Door Cups / Edges
{{c_hl}} Headlights       {{c_fl}} Fog Lights
{{c_tl}} Taillights       {{c_mc}} Mirror Caps
{{c_pl}} A/B/C/D Pillars  {{c_rf}} Roof
{{c_sp}} Spoiler          {{c_la}} Luggage Area
{{c_ic}} Interior Console {{c_it}} Interior Trim
Individual Panels / Notes: {{ppfNotes}}

Total Price: {{ppfPrice}}
```
