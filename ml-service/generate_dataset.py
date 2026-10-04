"""
Synthetic dataset generator for AI-Powered-Manufacturing-Operations-Support.

Creates:
  data/machines.csv  - machines on the shop floor
  data/users.csv     - engineers/technicians with skills
  data/tickets.csv   - historical incident tickets with RCA + CAPA

Usage:
  python generate_dataset.py                 # 1200 tickets
  python generate_dataset.py --n 2000 --seed 7

No external libraries needed (standard library only).
NOTE: data is synthetic - good for demonstrating the pipeline, not for
claiming real-world accuracy.
"""
import argparse
import csv
import os
import random
from datetime import datetime, timedelta

# ---------------------------------------------------------------- master data
MACHINES = [
    ("CNC-01", "CNC Milling Machine", "Line-A"),
    ("CNC-02", "CNC Lathe", "Line-A"),
    ("PRS-01", "Hydraulic Press", "Line-B"),
    ("PRS-02", "Stamping Press", "Line-B"),
    ("CNV-01", "Conveyor Belt", "Line-C"),
    ("CNV-02", "Conveyor Belt", "Line-C"),
    ("WLD-01", "Welding Robot", "Line-D"),
    ("WLD-02", "Welding Robot", "Line-D"),
    ("PNT-01", "Paint Booth", "Line-E"),
    ("ASM-01", "Assembly Station", "Line-E"),
    ("PKG-01", "Packaging Unit", "Line-F"),
    ("CMP-01", "Air Compressor", "Utilities"),
]

# name, role, skills (categories), shift
USERS = [
    ("Ravi Kumar", "Maintenance Engineer", ["Mechanical", "Safety"], "Day"),
    ("Anita Sharma", "Electrical Engineer", ["Electrical", "Automation"], "Day"),
    ("Shivani", "Quality Engineer", ["Quality", "Process"], "Day"),
    ("Meena Iyer", "Process Engineer", ["Process", "Quality"], "Night"),
    ("Divya S", "Maintenance Technician", ["Mechanical", "Electrical"], "Night"),
    ("Deepa Nair", "Automation Engineer", ["Automation", "Electrical"], "Day"),
    ("Sneha Patil", "Safety Officer", ["Safety", "Process"], "Day"),
    ("Priya Menon", "Reliability Engineer", ["Mechanical", "Process"], "Night"),
]

REPORTERS = ["Operator A. Raj", "Operator S. Lakshmi", "Supervisor R. Kavitha",
             "Operator S. Revathi", "Line Lead A. Swathi", "Operator T. Mary",
             "Operator M. Pooja", "Shift In-charge R. Nandini"]

# ------------------------------------------------------------------ scenarios
# Each scenario: category, symptoms (several phrasings), root_cause_category (6M),
# root_cause, corrective, preventive, priority weights (Low, Medium, High, Critical)
SCENARIOS = [
    # ---------------- Mechanical
    dict(category="Mechanical",
         symptoms=["{m} making loud grinding noise from spindle area",
                   "unusual vibration and high-pitched noise on {m} during run",
                   "{m} bearing sounds rough, temperature rising near motor end",
                   "metal grinding sound coming from {m} drive section"],
         rc_cat="Machine",
         root_cause="Bearing wear due to inadequate lubrication over multiple shifts",
         corrective="Replace worn bearing, re-grease and realign shaft, run 30-min trial",
         preventive="Add bearing lubrication to weekly PM checklist; install vibration sensor with alert threshold",
         pw=[0.1, 0.35, 0.45, 0.1]),
    dict(category="Mechanical",
         symptoms=["hydraulic oil leaking under {m}, puddle on floor",
                   "{m} pressure dropping, oil seen near cylinder",
                   "oil leak at hose joint of {m}, machine slow to respond"],
         rc_cat="Material",
         root_cause="Hydraulic seal degraded due to age and use of non-spec seal material",
         corrective="Replace seal and hose with OEM-spec parts, top up and bleed hydraulic oil",
         preventive="Define seal replacement interval; stock only OEM-approved spares; add leak inspection to daily round",
         pw=[0.05, 0.3, 0.5, 0.15]),
    dict(category="Mechanical",
         symptoms=["{m} belt slipping and product jerking on the line",
                   "belt on {m} misaligned and edge fraying",
                   "{m} drive belt tension low, intermittent stops"],
         rc_cat="Method",
         root_cause="Belt tension not checked after last maintenance; no standard tension procedure",
         corrective="Re-tension and align belt, replace frayed section",
         preventive="Create SOP with tension measurement values; add post-maintenance verification step",
         pw=[0.2, 0.5, 0.25, 0.05]),
    # ---------------- Electrical
    dict(category="Electrical",
         symptoms=["{m} tripped on overload, motor hot to touch",
                   "motor of {m} keeps tripping breaker after 10 minutes of running",
                   "overcurrent fault on {m} drive, restart fails"],
         rc_cat="Machine",
         root_cause="Motor winding insulation degraded causing high current draw",
         corrective="Replace motor, verify current draw within rated limits",
         preventive="Quarterly insulation resistance test; thermal imaging scan in PM schedule",
         pw=[0.05, 0.3, 0.5, 0.15]),
    dict(category="Electrical",
         symptoms=["{m} sensor not detecting parts, line stops randomly",
                   "proximity sensor on {m} giving intermittent signal",
                   "false stop on {m} - sensor flickering, wiring looks loose"],
         rc_cat="Machine",
         root_cause="Loose connector and damaged cable insulation at sensor due to vibration",
         corrective="Re-terminate connector, replace damaged cable, secure with clamps",
         preventive="Use vibration-rated connectors; add cable routing check to monthly inspection",
         pw=[0.2, 0.5, 0.25, 0.05]),
    dict(category="Electrical",
         symptoms=["power supply voltage fluctuation, {m} control panel resetting",
                   "{m} PLC rebooting randomly, panel lights flicker",
                   "control panel of {m} shows undervoltage alarm"],
         rc_cat="Environment",
         root_cause="Unstable supply voltage during peak load; no voltage stabilizer on control circuit",
         corrective="Install stabilizer/UPS on control circuit, tighten incoming terminals",
         preventive="Power quality monitoring on feeder; load balancing across shifts",
         pw=[0.05, 0.25, 0.45, 0.25]),
    # ---------------- Quality
    dict(category="Quality",
         symptoms=["parts from {m} out of tolerance, diameter oversize by 0.05 mm",
                   "dimension rejection from {m} batch, gauge reading above limit",
                   "high rejection rate at {m} - dimensional mismatch found at inspection"],
         rc_cat="Measurement",
         root_cause="Gauge out of calibration and tool offset not updated after tool change",
         corrective="Recalibrate gauge, reset tool offset, re-inspect last batch and quarantine suspects",
         preventive="Calibration schedule tracked in system; mandatory first-piece inspection after tool change",
         pw=[0.05, 0.4, 0.45, 0.1]),
    dict(category="Quality",
         symptoms=["surface scratches found on products from {m}",
                   "customer complaint: scratch marks on finished parts from {m} line",
                   "visual defect - scratches and dents on parts after {m}"],
         rc_cat="Method",
         root_cause="Parts contacting each other during handling due to missing separators in trolley",
         corrective="Sort and rework affected lot, add separators to trolley",
         preventive="Update handling work instruction; add visual check at station exit",
         pw=[0.25, 0.5, 0.2, 0.05]),
    dict(category="Quality",
         symptoms=["weld porosity found in samples from {m}",
                   "weak weld joints detected in destructive test, {m}",
                   "weld spatter and incomplete fusion seen on parts from {m}"],
         rc_cat="Material",
         root_cause="Shielding gas contamination and moisture in wire spool",
         corrective="Replace gas cylinder and wire spool, re-weld and re-test affected parts",
         preventive="Store wire in dry cabinet; gas purity check on cylinder receipt",
         pw=[0.05, 0.3, 0.45, 0.2]),
    # ---------------- Safety
    dict(category="Safety",
         symptoms=["safety guard missing on {m}, operator noticed during start of shift",
                   "interlock on {m} door bypassed with tape",
                   "emergency stop on {m} not responding during test"],
         rc_cat="Man",
         root_cause="Guard removed during maintenance and not refitted; no sign-off before restart",
         corrective="Refit guard, restore interlock, retest e-stop, counsel involved personnel",
         preventive="Lockout-tagout with restart sign-off checklist; periodic safety audit and retraining",
         pw=[0.0, 0.1, 0.4, 0.5]),
    dict(category="Safety",
         symptoms=["near miss: operator slipped on oil near {m}",
                   "slip hazard reported around {m}, floor wet and oily",
                   "operator minor injury - slipped near {m} on spilled coolant"],
         rc_cat="Environment",
         root_cause="Coolant/oil leak not cleaned promptly; no drip tray and housekeeping gap",
         corrective="Clean area, fit drip tray, fix source of leak, place warning signage",
         preventive="Housekeeping checklist each shift; leak detection in daily round",
         pw=[0.05, 0.3, 0.45, 0.2]),
    dict(category="Safety",
         symptoms=["smoke smell and slight sparks near {m} panel",
                   "burning smell from electrical panel of {m}",
                   "overheating cable observed at {m}, insulation discoloured"],
         rc_cat="Machine",
         root_cause="Undersized cable and loose lug causing overheating under load",
         corrective="Isolate power, replace cable with correct rating, tighten and torque-mark lugs",
         preventive="Thermography survey of panels every quarter; cable sizing review on any load addition",
         pw=[0.0, 0.05, 0.35, 0.6]),
    # ---------------- Process
    dict(category="Process",
         symptoms=["cycle time on {m} increased by 15 percent this week",
                   "{m} output dropped, takt time not being met",
                   "production slow at {m}, frequent waiting between steps"],
         rc_cat="Method",
         root_cause="Changeover steps not standardized; operators using different sequences",
         corrective="Time-study the sequence and publish standard work for changeover",
         preventive="SMED workshop; visual work instruction at station; monthly process audit",
         pw=[0.3, 0.5, 0.18, 0.02]),
    dict(category="Process",
         symptoms=["paint thickness inconsistent on parts from {m}",
                   "{m} coating uneven, orange peel texture on panels",
                   "paint finish defect on {m}, run marks visible"],
         rc_cat="Environment",
         root_cause="Booth humidity and temperature outside spec; filter clogged",
         corrective="Replace filters, adjust HVAC setpoints, re-coat affected parts",
         preventive="Add humidity/temperature alarm; filter change interval in PM plan",
         pw=[0.1, 0.5, 0.35, 0.05]),
    dict(category="Process",
         symptoms=["raw material shortage at {m}, line waiting for feed",
                   "line stopped at {m} - material not delivered on time",
                   "wrong material grade supplied to {m}"],
         rc_cat="Material",
         root_cause="Kanban signal missed and supplier delivery schedule not aligned with production plan",
         corrective="Expedite material, verify grade before loading",
         preventive="Revise reorder points; weekly supplier delivery review; incoming grade check",
         pw=[0.1, 0.45, 0.35, 0.1]),
    # ---------------- Automation
    dict(category="Automation",
         symptoms=["PLC fault code on {m}, program halted",
                   "{m} HMI shows communication error with PLC",
                   "robot on {m} stopped with servo alarm"],
         rc_cat="Machine",
         root_cause="Firmware mismatch after last update and weak network cable between HMI and PLC",
         corrective="Reflash correct firmware, replace network cable, verify communication",
         preventive="Change-control for firmware updates with rollback plan; periodic network health test",
         pw=[0.05, 0.4, 0.45, 0.1]),
    dict(category="Automation",
         symptoms=["MES not receiving production count from {m}",
                   "data from {m} missing on dashboard since morning",
                   "barcode scanner at {m} failing to read labels"],
         rc_cat="Measurement",
         root_cause="Gateway service stopped after server patching; scanner lens dirty",
         corrective="Restart and auto-enable gateway service, clean scanner, backfill missed counts",
         preventive="Service health monitoring with alerts; scanner cleaning in daily checklist",
         pw=[0.25, 0.5, 0.2, 0.05]),
    dict(category="Automation",
         symptoms=["robot on {m} positioning drift, parts picked off-centre",
                   "{m} vision system rejecting good parts",
                   "calibration lost on {m} robot after emergency stop"],
         rc_cat="Method",
         root_cause="Robot TCP not re-calibrated after collision/e-stop recovery; no recovery procedure",
         corrective="Re-teach TCP and vision calibration, validate with test pieces",
         preventive="Document post-e-stop recovery SOP; add calibration check to start-of-shift routine",
         pw=[0.1, 0.45, 0.35, 0.1]),
]

PRIORITIES = ["Low", "Medium", "High", "Critical"]
# resolution hours (mean) by priority
RES_HOURS = {"Low": 36, "Medium": 18, "High": 8, "Critical": 4}

PREFIXES = ["", "", "", "URGENT: ", "Reported by operator: ", "FYI - ", "Pls check: "]
SUFFIXES = ["", "", " Please check asap.", " Happened during night shift.",
            " Started after lunch break.", " Seen 2 times today.", " Not first time."]

# Impact statements: on a real floor, priority follows impact. Each ticket
# usually (75%) gets a phrase matching its priority, sometimes (15%) one from a
# neighbouring level (people over/under-state impact), sometimes (10%) none.
# This makes priority learnable from text without making it trivial.
IMPACT = {
    "Low": [" No impact on output.", " Cosmetic only, can wait for planned maintenance.",
            " Workaround in place, low urgency.", " Minor, running normally."],
    "Medium": [" Production affected.", " Line is running at reduced speed.",
               " Some rework needed.", " Output down slightly."],
    "High": [" Line stopped intermittently.", " Big scrap pile building up.",
             " Customer order at risk.", " Throughput down by half."],
    "Critical": [" Entire line down.", " Person injured, first aid given.",
                 " Shipment on hold, customer escalation.", " Machine stopped, no backup available."],
}
TYPO_SWAPS = [("machine", "machne"), ("noise", "nois"), ("sensor", "senser"),
              ("pressure", "presure"), ("operator", "opertor"), ("check", "chek")]


def impact_phrase(priority, rng):
    roll = rng.random()
    if roll < 0.10:
        return ""
    level = PRIORITIES.index(priority)
    if roll < 0.25:
        level = min(max(level + rng.choice([-1, 1]), 0), len(PRIORITIES) - 1)
    return rng.choice(IMPACT[PRIORITIES[level]])


def add_noise(text, rng):
    """Light realism: typos, casing, prefix/suffix."""
    if rng.random() < 0.15:
        a, b = rng.choice(TYPO_SWAPS)
        text = text.replace(a, b)
    if rng.random() < 0.08:
        text = text.lower()
    return rng.choice(PREFIXES) + text + rng.choice(SUFFIXES)


def pick_assignee(category, rng):
    skilled = [u for u in USERS if category in u[2]]
    pool = skilled if rng.random() < 0.88 else USERS  # a little real-world messiness
    return rng.choice(pool)[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=1200)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="data")
    args = ap.parse_args()

    rng = random.Random(args.seed)
    os.makedirs(args.out, exist_ok=True)

    with open(os.path.join(args.out, "machines.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["machine_id", "machine_type", "line"])
        w.writerows(MACHINES)

    with open(os.path.join(args.out, "users.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["name", "role", "skills", "shift"])
        for name, role, skills, shift in USERS:
            w.writerow([name, role, "|".join(skills), shift])

    start = datetime(2025, 1, 1, 6, 0)
    span_hours = 24 * 540  # ~18 months
    rows = []
    for i in range(args.n):
        sc = rng.choice(SCENARIOS)
        mid, mtype, line = rng.choice(MACHINES)
        created = start + timedelta(hours=rng.uniform(0, span_hours))
        desc_core = rng.choice(sc["symptoms"]).format(m=f"{mid} ({mtype})")
        priority = rng.choices(PRIORITIES, weights=sc["pw"])[0]
        description = add_noise(desc_core, rng) + impact_phrase(priority, rng)
        # short title = first clause
        title = desc_core.split(",")[0].split(" - ")[0]
        title = title[:80]; title = title[0].upper() + title[1:]
        hours = max(0.5, rng.gauss(RES_HOURS[priority], RES_HOURS[priority] * 0.3))
        rows.append({
            "ticket_id": f"INC-{1000 + i}",
            "created_at": created.strftime("%Y-%m-%d %H:%M"),
            "reported_by": rng.choice(REPORTERS),
            "machine_id": mid,
            "line": line,
            "title": title,
            "description": description,
            "category": sc["category"],
            "priority": priority,
            "root_cause_category": sc["rc_cat"],
            "root_cause": sc["root_cause"],
            "corrective_action": sc["corrective"],
            "preventive_action": sc["preventive"],
            "assigned_to": pick_assignee(sc["category"], rng),
            "status": "Closed",
            "resolution_hours": round(hours, 1),
        })

    rows.sort(key=lambda r: r["created_at"])
    # re-number in time order for tidy IDs
    for i, r in enumerate(rows):
        r["ticket_id"] = f"INC-{1000 + i}"

    with open(os.path.join(args.out, "tickets.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} tickets, {len(USERS)} users, {len(MACHINES)} machines to '{args.out}/'")


if __name__ == "__main__":
    main()
