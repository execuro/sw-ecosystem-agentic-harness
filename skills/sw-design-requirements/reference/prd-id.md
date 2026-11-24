# The PRD ID

Every PRD has an ID. It starts the file name (`specs/<id>-slug.md`), fills the `**ID**` row of the meta table and is carried by the spec, the ADRs, the verification report and every AC test marker (`#[Group('<id>-AC3')]`, `@<id>`). The ID never changes after the file is created.

## Ask for the ticket

Before creating a new PRD, ask the user for the ticket key of the feature, with a structured question tool if you have one (Claude Code: `AskUserQuestion`; Codex: `request_user_input`). The team may use any tracker (Jira, GitHub issues, Trello, Asana, Linear...): take the key as the user gives it, never assume a format. If the briefing already names the ticket, use it and do not ask.

Clean the key:

1. Keep the whole key, prefix included: `SHOP-12` and `BACKEND-12` are two different IDs.
2. Keep only letters, digits and `-`: `#45` becomes `45`, `SHOP 12` becomes `SHOP-12`.
3. If the key is only digits, ask for a prefix (the tracker or the repository, for example `GH-45` or `shop-45`): plain numbers from different repositories collide.

## No ticket

If the user has no ticket, use a local number: the highest 4-digit number at the start of a file name in `specs/`, plus 1, zero-padded to 4 (`0008`). Two people working in parallel without tickets can get the same number: that is accepted, and they rename one by hand.

## Before writing

If a file starting with `<id>-` already exists in `specs/`, stop and ask the user: it is either the same feature (continue that PRD) or a wrong key.
