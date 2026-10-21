EasyUI Alert and Animated Tabs are adapted from https://github.com/Surajmaurya1/easyui.
Source: https://easyui.site/components/alert and https://easyui.site/components/animated-tabs.
Adaptations use motion/react, Bidcraft styles, reduced motion, and keyboard tab navigation.

MIT License

Copyright (c) 2026 Suraj Maurya

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Anatomy drawing kit — MIT © 2026 Ryan
https://github.com/wheresryan22/anatomy

The unmodified drawing kit files in `vendor/anatomy` are pinned to commit `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`. The complete MIT notice is included in `vendor/anatomy/LICENSE`. Bidcraft's inspection bench is original geometry authored with this kit, using generated SVG paths and scoped brand styles.

## South African procurement data

Tender discovery republishes data supplied through National Treasury's eTender portal and OCDS API. The [publication policy](https://data.etenders.gov.za/Home/LearnMore) permits commercial and non-commercial reuse and republication with a link to the original source. The [OCDS API schema](https://ocds-api.etenders.gov.za/swagger/v1/swagger.json) identifies the Open Data Commons Public Domain Dedication and Licence (PDDL). Source links and provider attribution are retained. This data is not a complete or guaranteed-current record of South African procurement.


## EasyUI component integrations (2026-10-21)

The following components are adapted from the MIT-licensed [EasyUI source](https://github.com/Surajmaurya1/easyui) by Suraj Maurya, under the MIT copyright notice above:

- [Animated Number](https://easyui.site/components/animated-number) — used for Today KPI values; adjusted for en-ZA locale and accessible output.
- [Badge](https://easyui.site/components/badge) — used for tender status, deadline and briefing indicators; toned to Bidcraft and reduced-motion-aware.
- [Button](https://easyui.site/components/button) — used for tender search/apply and AI audit with loading/tap states.
- [FAQ](https://easyui.site/components/faq) — used for About and feature-limitation disclosures with search and accessible accordion controls.

Existing EasyUI Animated Tabs and Alert remain in use. Alert now uses Phosphor icons, like all new adaptations. We intentionally avoid copying EasyUI's default dark styling or adding unnecessary animation dependencies: components retain Bidcraft's Urbanist type, paper/teal/ink/chartreuse palette and the existing `motion/react` package. More dramatic EasyUI components (loading page transitions, hover-only menus, animated input gimmicks) are deliberately excluded from critical deadline and legal interfaces. The adaptations retain license attribution, are source-owned, and should be tested when upstream implementations change.
