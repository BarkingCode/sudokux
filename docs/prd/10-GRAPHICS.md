# Board & Graphics (Skia-Based)

## Board Rendering

All board visuals must be rendered via **React Native Skia**:

* Grid lines (thick brutalist lines)
* **Dynamic block separators** (2×3 for 6×6, 3×3 for 9×9)
* Numbers (Skia text renderer)
* Notes (small Skia text)
* Highlights (rectangular overlays)
* Mistake shake (Skia transform)
* Hint overlays
* Press/selection effects

## Completion Effects

* Brutalist confetti
* Rectangle bursts
* Bold "STAMP" success animation
* All Skia-powered

## Performance Requirements

* 60fps consistently
* No stuttering on Skia redraws
* Cache board layers to optimize
* Smooth on iPhone SE 2nd Gen and above
* iPad rendering must remain crisp
