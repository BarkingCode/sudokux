# User Identity (No Login)

## Anonymous User ID

On first launch:

* Generate `internal_user_id` (UUID)
* Store in SecureStore/AsyncStorage
* Auto-generate nickname (e.g., "Player-4832")
* Ask for:
  * Country (dropdown)
  * Region/City (free text, optional)

## Optional Game Center Integration (iOS)

If user is signed into Game Center:

* Capture Game Center player ID
* Use for:
  * Game Center leaderboards
  * Achievements

Internal ID remains the canonical identity.
