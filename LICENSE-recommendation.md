# LICENSE Recommendation for Tempo

**Status:** Analysis only. No `LICENSE` file has been added to the repository. This is a business decision with real legal consequences — it should be made by you, not defaulted to by an automated tool or coding agent.

---

## 1. Business Objective First

The stated goal is selling Tempo as a software asset on Acquire.com — i.e., transferring **exclusive ownership and commercial rights** to a single buyer for money. That objective is fundamentally in tension with every standard open-source license. Open-source licenses exist to *grant* rights to the public; an acquisition sale exists to *transfer and preserve exclusive* rights to one buyer. Keep this tension in mind through the comparison below.

## 2. Option Comparison

### Proprietary / "All Rights Reserved" (no public license grant)
- **What it means:** By default, under copyright law, you already own all rights the moment code is written — no LICENSE file is required for this to be true. An explicit proprietary notice just states it clearly instead of leaving it implicit.
- **Pros:** Preserves 100% of the exclusivity a buyer is paying for. Nothing to revoke or contest — there was never a public grant to begin with. This is what virtually every company selling proprietary software (the entire SaaS-acquisition market on platforms like Acquire.com, Flippa, MicroAcquire) actually uses.
- **Cons:** None that matter for a sale scenario. (The only downside — no public community contributions — is irrelevant here; you're not building an open-source community, you're selling an asset.)
- **Fit for this goal:** ✅ Strong fit.

### MIT License
- **What it means:** Anyone can use, copy, modify, sublicense, and sell copies of the software, with almost no restriction, as long as the license text is included.
- **Pros:** Simple, well understood, maximizes adoption — great for developer tools or libraries you want widely used.
- **Cons:** **Actively destroys acquisition value.** If Tempo ships under MIT today, that grant is public and irrevocable for every copy already distributed. A buyer would be acquiring a codebase the *public already has a perpetual right to use, modify, and redistribute* — they cannot un-ring that bell by buying the GitHub repo from you. This would need to be disclosed to any serious buyer and would materially reduce (possibly zero out) the exclusivity they're paying for.
- **Fit for this goal:** ❌ Wrong tool for this objective.

### Apache 2.0
- **What it means:** Similar to MIT, plus an explicit patent grant and contributor patent-litigation retaliation clause.
- **Pros/Cons:** Same core problem as MIT for this purpose — permissive public grant, incompatible with selling exclusivity. The added patent clause is irrelevant to project-cannot-un-open-source-itself issue.
- **Fit for this goal:** ❌ Wrong tool for this objective.

### GPL / AGPL (copyleft)
- **What it means:** Same permissive base as MIT/Apache, but anyone who distributes a modified version must also open-source their modifications under the same license. AGPL extends this to network/SaaS use.
- **Pros:** None applicable here — copyleft is designed to keep derivative works open, which is the opposite of what an asset sale needs.
- **Cons:** Same public-grant problem as MIT/Apache, plus it would legally obligate a buyer's *own future modifications* to be open-sourced too — actively hostile to a commercial buyer's interests. No serious SaaS acquirer would accept this.
- **Fit for this goal:** ❌ Actively harmful to this objective.

### Business Source License (BSL) — mentioned for completeness
- **What it means:** Source-available but not open-source: free for non-production/non-competing use, requires a commercial license for production use, converts to a permissive license after a set number of years.
- **Pros:** Used by companies (CockroachDB, MariaDB, Sentry) that want visible source without giving away commercial rights.
- **Cons:** Overkill and unnecessary complexity for a private repo that isn't publicly visible or trying to build a source-available community. Adds legal drafting overhead for no benefit here, since the repo isn't being kept public anyway.
- **Fit for this goal:** ⚠️ Unnecessary for this situation, not actively harmful.

## 3. Recommendation

**Do not add an open-source LICENSE file (MIT/Apache/GPL) to this repository before or during the sale.** Any of those would grant the public rights that directly undercut the exclusivity a buyer is paying for.

**Recommended: keep the repository private and either (a) add no LICENSE file at all** (default copyright — all rights reserved is the legal default with no file needed), **or (b) add an explicit short proprietary notice** for clarity with buyers and any collaborators, e.g.:

```
Copyright (c) 2026 [Your Name / Legal Entity — see legal/README.md, still a placeholder there too]
All rights reserved.

This software and associated source code are proprietary and confidential.
No license, express or implied, is granted for use, copying, modification,
or distribution without prior written permission from the copyright holder.
```

This mirrors exactly what `legal/README.md` already flags as an open item: `[Company Name / Legal Entity]` needs to be filled in before this (or the EULA/Terms) can be finalized. That's a naming/business-structure decision (are you selling as an individual, or is there a registered entity?), not a technical one — worth resolving once, since it affects this file, the EULA, and the Terms of Service simultaneously.

## 4. Decision Made

**Resolved August 5, 2026:** explicit proprietary notice, under the name **Mohamed Hatem**. The `LICENSE` file now exists in the repository with this text:

```
Copyright (c) 2026 Mohamed Hatem
All rights reserved.

This software and associated source code are proprietary and confidential.
No license, express or implied, is granted for use, copying, modification,
merging, publishing, distribution, sublicensing, or sale of copies of this
software, in whole or in part, without prior written permission from the
copyright holder.
```

**Related open item, not yet resolved:** `legal/README.md`, the EULA, Terms of Service, and Privacy Policy all still contain a `[Company Name / Legal Entity]` placeholder for the same underlying question this LICENSE file just answered. Whether those should now also read "Mohamed Hatem" — or something else, if the legal entity behind the Terms/EULA is meant to be different from the copyright holder on the code itself — hasn't been confirmed yet. Worth resolving together rather than leaving the LICENSE and the legal docs naming two different (or one named, one blank) parties.
