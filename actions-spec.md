# Target Air — action types to create

Three actions turn this from a report into an application. Create them in
Ontology Manager; I will build the forms that call them.

Order matters. Step 0 must be done per object type before its action can exist.

---

## Step 0 — enable edits on the three object types

An object type backed by a dataset is read-only until you say otherwise. All
three currently show **Edits: Disabled**.

For each of **Shortage**, **Aircraft**, **NonConformance**:

1. Open the object type in Ontology Manager.
2. **Datasources** tab.
3. **Edits** section → turn on **Allow edits**.
4. Save.

Leave *Enable object edit history* off. It takes several minutes to initialise
and disables edits while it runs. We do not need audit history for a prototype,
and it is easy to turn on later.

> Edits are stored as an overlay on top of the dataset. The CSV is never
> rewritten, so re-running `generate.py` and re-uploading will not clobber an
> edit — but it also will not undo one. Worth knowing before you test.

---

## Action 1 — Update forecast delivery date

The most valuable one, and the one a C-suite user actually performs. Re-forecast
a tail when the line tells you the date has moved.

- **Object type** `Aircraft`
- **Action type** Modify object
- **API name** `update-forecast-date`
- **Display name** Update forecast delivery
- **Parameters**

  | Parameter | Type | Required | Notes |
  | --- | --- | --- | --- |
  | `aircraft` | Aircraft object | yes | the tail being re-forecast |
  | `forecastDeliveryDate` | Timestamp | yes | the new forecast |
  | `reason` | String | yes | free text, why it moved |

- **Modifies** `Aircraft.forecastDeliveryDate`

`reason` is not written anywhere — the ontology has no field for it. Make the
parameter required anyway. It costs nothing, it forces the user to think, and
in a real build it is the thing you would persist to an audit object. Worth
being able to say that out loud.

---

## Action 2 — Acknowledge a shortage

- **Object type** `Shortage`
- **Action type** Modify object
- **API name** `acknowledge-shortage`
- **Display name** Acknowledge shortage
- **Parameters**

  | Parameter | Type | Required | Notes |
  | --- | --- | --- | --- |
  | `shortage` | Shortage object | yes | |
  | `status` | String | yes | allowed values `Open`, `Mitigating`, `Closed` |
  | `expectedRecoveryDate` | Timestamp | yes | revised recovery |

- **Modifies** `Shortage.status`, `Shortage.expectedRecoveryDate`

Constrain `status` to those three values in the parameter configuration rather
than leaving it free text. A free string field here is how you end up with
"mitigating", "Mitigating " and "MITIGATING" in the same column.

---

## Action 3 — Disposition a non-conformance

- **Object type** `NonConformance`
- **Action type** Modify object
- **API name** `disposition-ncr`
- **Display name** Disposition non-conformance
- **Parameters**

  | Parameter | Type | Required | Notes |
  | --- | --- | --- | --- |
  | `nonConformance` | NonConformance object | yes | |
  | `disposition` | String | yes | allowed values `Use As Is`, `Rework`, `Scrap` |
  | `status` | String | yes | allowed values `Open`, `Dispositioned`, `Closed` |
  | `closedDate` | Timestamp | no | set when status is Closed |

- **Modifies** `NonConformance.disposition`, `NonConformance.status`,
  `NonConformance.closedDate`

---

## Step 4 — the step everyone forgets

Creating action types does **not** put them in the SDK. You have to add them to
the application and regenerate.

1. Developer Console → **Target Air** → **Ontology SDK** → **Resources**.
2. **Action types** section → **Add action type** → select all three.
3. **Save changes**.
4. **SDK versions** tab → **Generate new version**. It will publish `0.2.0`.

Then tell me, and I will reinstall the SDK locally and build the forms. Until
that regeneration happens the actions are invisible to the application, no
matter how correct they are in the ontology.

---

## What I will build once they exist

- **Re-forecast a tail** from the airframe detail page. The one action an
  executive performs directly.
- **Acknowledge a shortage** from both the overview shortage table and the
  airframe detail page.
- **Disposition an NCR** from the airframe detail page.

Each with optimistic UI, an error path that surfaces Foundry's validation
message rather than a generic failure, and a re-read after submit so the screen
reflects what the ontology actually stored rather than what we hoped it stored.
